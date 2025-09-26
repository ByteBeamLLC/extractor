export interface GraphNodeError {
  error: string
  code?: string
  details?: unknown
}

export type GraphNodeResult<TResult> =
  | { ok: true; value: TResult }
  | { ok: false; error: GraphNodeError }

export interface GraphNodeContext<TState = unknown> {
  state: TState
  abortSignal?: AbortSignal
}

export interface GraphNodeHandlerArgs<TInput, TState = unknown> {
  input: TInput
  context: GraphNodeContext<TState>
}

export type GraphNodeHandler<TInput = unknown, TResult = unknown, TState = unknown> = (
  args: GraphNodeHandlerArgs<TInput, TState>,
) => Promise<TResult> | TResult

export interface NodeRuntimeOptions {
  maxRetries?: number
  timeoutMs?: number
  signal?: AbortSignal
  /**
   * Backoff delay applied before retrying. When a function is provided it receives the failed attempt index (1-based).
   */
  backoffMs?: number | ((attempt: number) => number)
  onRetry?: (payload: { attempt: number; error: GraphNodeError }) => void
}

export interface NodeExecutionArgs<TInput, TResult, TState> {
  handler: GraphNodeHandler<TInput, TResult, TState>
  input: TInput
  state: TState
  options?: NodeRuntimeOptions
}
