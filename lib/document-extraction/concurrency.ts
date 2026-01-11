/**
 * Concurrency control utilities for parallel processing
 */

import {
  INITIAL_CONCURRENCY,
  MIN_CONCURRENCY,
  MAX_CONCURRENCY,
} from "./constants"

/**
 * Dynamic concurrency controller with adaptive scaling
 */
export class ConcurrencyController {
  private currentConcurrency: number
  private consecutiveSuccesses: number = 0
  private consecutiveFailures: number = 0

  constructor(initial: number = INITIAL_CONCURRENCY) {
    this.currentConcurrency = initial
  }

  get concurrency(): number {
    return this.currentConcurrency
  }

  onSuccess(): void {
    this.consecutiveSuccesses++
    this.consecutiveFailures = 0
    if (this.consecutiveSuccesses >= 5 && this.currentConcurrency < MAX_CONCURRENCY) {
      this.currentConcurrency++
      this.consecutiveSuccesses = 0
      console.log(`[concurrency] Increased to ${this.currentConcurrency}`)
    }
  }

  onRateLimit(): void {
    this.consecutiveFailures++
    this.consecutiveSuccesses = 0
    if (this.currentConcurrency > MIN_CONCURRENCY) {
      this.currentConcurrency = Math.max(MIN_CONCURRENCY, Math.floor(this.currentConcurrency * 0.6))
      console.log(`[concurrency] Decreased to ${this.currentConcurrency} due to rate limit`)
    }
  }

  onError(): void {
    this.consecutiveFailures++
    this.consecutiveSuccesses = 0
  }
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  const err = error as { message?: string; status?: number; statusCode?: number }
  const message = err?.message?.toLowerCase() || ""
  const status = err?.status || err?.statusCode
  return (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("quota exceeded")
  )
}
