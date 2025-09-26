import { ensureServerOnly } from '@/lib/server/ensureServerOnly'
import type {
  GraphNodeError,
  GraphNodeResult,
  NodeExecutionArgs,
  NodeRuntimeOptions,
} from './types'

const MODULE_ID = 'lib/llm/graph/runtime'

ensureServerOnly(MODULE_ID)

export const DEFAULT_RETRY_DELAY_MS = 250

export async function runGraphNode<TInput, TResult, TState>(
  args: NodeExecutionArgs<TInput, TResult, TState>,
): Promise<GraphNodeResult<TResult>> {
  const { handler, input, state, options } = args
  const runtimeOptions = options ?? {}
  const maxRetries = runtimeOptions.maxRetries ?? 0

  if (runtimeOptions.signal?.aborted) {
    return { ok: false, error: toGraphNodeError(createAbortError(runtimeOptions.signal.reason)) }
  }

  let attempt = 0
  let lastError: GraphNodeError | undefined

  while (attempt <= maxRetries) {
    try {
      const result = await executeAttempt({ handler, input, state, options: runtimeOptions })
      return { ok: true, value: result }
    } catch (error) {
      attempt += 1
      const graphError = toGraphNodeError(error)
      lastError = graphError

      if (attempt > maxRetries) {
        return { ok: false, error: graphError }
      }

      runtimeOptions.onRetry?.({ attempt, error: graphError })

      const backoff = computeBackoffDelay(runtimeOptions, attempt)
      if (backoff > 0) {
        await delay(backoff)
      }

      if (runtimeOptions.signal?.aborted) {
        return { ok: false, error: toGraphNodeError(createAbortError(runtimeOptions.signal.reason)) }
      }
    }
  }

  return { ok: false, error: lastError ?? { error: 'Unknown error' } }
}

export function toGraphNodeError(error: unknown, fallback?: Partial<GraphNodeError>): GraphNodeError {
  if (isGraphNodeError(error)) {
    return error
  }

  const fallbackError = fallback?.error ?? 'Unknown error'
  const fallbackCode = fallback?.code
  const fallbackDetails = fallback?.details

  if (typeof error === 'string') {
    return {
      error,
      code: fallbackCode,
      details: fallbackDetails ?? error,
    }
  }

  if (error && typeof error === 'object') {
    if (isGraphNodeErrorShape(error)) {
      return {
        error: typeof error.error === 'string' ? error.error : fallbackError,
        code: typeof error.code === 'string' ? error.code : fallbackCode,
        details: 'details' in error ? (error as { details?: unknown }).details : error,
      }
    }

    const err = error as Error & { code?: string }
    return {
      error: err.message || fallbackError,
      code: typeof err.code === 'string' ? err.code : fallbackCode,
      details: fallbackDetails ?? err,
    }
  }

  return {
    error: fallbackError,
    code: fallbackCode,
    details: fallbackDetails ?? error,
  }
}

export function isGraphNodeError(value: unknown): value is GraphNodeError {
  return isGraphNodeErrorShape(value)
}

function isGraphNodeErrorShape(value: unknown): value is GraphNodeError {
  return Boolean(value) && typeof value === 'object' && typeof (value as GraphNodeError).error === 'string'
}

async function executeAttempt<TInput, TResult, TState>(
  executionArgs: NodeExecutionArgs<TInput, TResult, TState>,
): Promise<TResult> {
  const { handler, input, state, options } = executionArgs
  const composite = createCompositeSignal(options?.signal, options?.timeoutMs)

  try {
    const task = Promise.resolve(
      handler({
        input,
        context: {
          state,
          abortSignal: composite?.signal ?? options?.signal,
        },
      }),
    )

    if (composite?.timerPromise) {
      return await Promise.race([task, composite.timerPromise])
    }

    return await task
  } finally {
    composite?.cleanup()
  }
}

function computeBackoffDelay(options: NodeRuntimeOptions, attempt: number): number {
  const { backoffMs } = options
  if (typeof backoffMs === 'function') {
    return Math.max(0, backoffMs(attempt))
  }
  if (typeof backoffMs === 'number') {
    return Math.max(0, backoffMs)
  }
  return DEFAULT_RETRY_DELAY_MS * attempt
}

function delay(durationMs: number): Promise<void> {
  if (durationMs <= 0) {
    return Promise.resolve()
  }
  return new Promise((resolve) => setTimeout(resolve, durationMs))
}

function createTimeoutError(timeoutMs: number): Error & { code: string } {
  const error = new Error(`[llm][graph] Node timed out after ${timeoutMs}ms`) as Error & { code: string }
  error.name = 'NodeTimeoutError'
  error.code = 'timeout'
  return error
}

function createAbortError(reason: unknown): Error & { code: string } {
  if (reason instanceof Error) {
    const err = reason as Error & { code?: string }
    err.code = typeof err.code === 'string' ? err.code : 'aborted'
    return err as Error & { code: string }
  }

  if (typeof reason === 'string') {
    const err = new Error(reason) as Error & { code: string }
    err.name = 'AbortError'
    err.code = 'aborted'
    return err
  }

  const err = new Error('Node execution aborted.') as Error & { code: string }
  err.name = 'AbortError'
  err.code = 'aborted'
  return err
}

interface CompositeSignal {
  signal?: AbortSignal
  timerPromise?: Promise<never>
  cleanup(): void
}

function createCompositeSignal(signal?: AbortSignal, timeoutMs?: number): CompositeSignal | undefined {
  const supportsAbortController = typeof AbortController !== 'undefined'
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let abortListener: (() => void) | undefined

  if (!supportsAbortController) {
    if (timeoutMs == null && !signal) {
      return undefined
    }

    const timerPromise =
      typeof timeoutMs === 'number'
        ? new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(createTimeoutError(timeoutMs))
            }, timeoutMs)
          })
        : undefined

    return {
      signal,
      timerPromise,
      cleanup: () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      },
    }
  }

  const controller = new AbortController()

  if (signal) {
    if (signal.aborted) {
      controller.abort(getAbortReason(signal))
    } else {
      abortListener = () => controller.abort(getAbortReason(signal))
      signal.addEventListener('abort', abortListener, { once: true })
    }
  }

  const timerPromise =
    typeof timeoutMs === 'number'
      ? new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            const timeoutError = createTimeoutError(timeoutMs)
            if (!controller.signal.aborted) {
              controller.abort(timeoutError)
            }
            reject(timeoutError)
          }, timeoutMs)
        })
      : undefined

  return {
    signal: controller.signal,
    timerPromise,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (signal && abortListener) {
        signal.removeEventListener('abort', abortListener)
      }
    },
  }
}

function getAbortReason(signal: AbortSignal): unknown {
  return (signal as AbortSignal & { reason?: unknown }).reason
}
