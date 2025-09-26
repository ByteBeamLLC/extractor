import { describe, expect, it, vi } from 'vitest'
import { runGraphNode, toGraphNodeError } from '@/lib/llm/graph/runtime'
import type { GraphNodeError } from '@/lib/llm/graph/types'

describe('runGraphNode', () => {
  it('returns the handler result on success', async () => {
    const handler = vi.fn(async ({ input }: { input: number }) => input * 2)

    const result = await runGraphNode({ handler, input: 4, state: {} })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(8)
    }
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('retries when the handler throws and eventually succeeds', async () => {
    const calls: number[] = []
    const handler = vi.fn(async () => {
      calls.push(Date.now())
      if (calls.length < 3) {
        throw new Error('transient')
      }
      return 'done'
    })

    const onRetry = vi.fn()

    const result = await runGraphNode({
      handler,
      input: undefined,
      state: {},
      options: {
        maxRetries: 3,
        backoffMs: 0,
        onRetry,
      },
    })

    expect(handler).toHaveBeenCalledTimes(3)
    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('done')
    }
  })

  it('returns a timeout error when the handler does not settle in time', async () => {
    const handler = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('late'), 30)
        }),
    )

    const result = await runGraphNode({
      handler,
      input: undefined,
      state: {},
      options: {
        timeoutMs: 5,
        maxRetries: 0,
      },
    })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('timeout')
      expect(result.error.error).toMatch(/timed out/i)
    }
  })
})

describe('toGraphNodeError', () => {
  it('wraps Error instances', () => {
    const error = new Error('boom')
    ;(error as Error & { code?: string }).code = 'failure'

    const result = toGraphNodeError(error)
    expect(result.code).toBe('failure')
    expect(result.error).toBe('boom')
    expect(result.details).toBe(error)
  })

  it('passes through GraphNodeError-like objects', () => {
    const payload: GraphNodeError = { error: 'bad', code: 'oops', details: { some: 'info' } }

    const result = toGraphNodeError(payload)
    expect(result).toStrictEqual(payload)
  })

  it('uses fallback when provided', () => {
    const result = toGraphNodeError(42, { error: 'custom', code: 'unknown' })
    expect(result.error).toBe('custom')
    expect(result.code).toBe('unknown')
    expect(result.details).toBe(42)
  })
})
