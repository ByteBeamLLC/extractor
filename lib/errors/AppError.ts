/**
 * Custom error classes for structured error handling
 */

/**
 * Error codes for application errors
 */
export enum ErrorCode {
  // Authentication errors (1xxx)
  UNAUTHORIZED = 1001,
  FORBIDDEN = 1002,
  SESSION_EXPIRED = 1003,

  // Validation errors (2xxx)
  VALIDATION_ERROR = 2001,
  INVALID_INPUT = 2002,
  MISSING_REQUIRED_FIELD = 2003,

  // Resource errors (3xxx)
  NOT_FOUND = 3001,
  ALREADY_EXISTS = 3002,
  CONFLICT = 3003,

  // Processing errors (4xxx)
  PROCESSING_ERROR = 4001,
  EXTRACTION_FAILED = 4002,
  OCR_FAILED = 4003,
  AI_GENERATION_FAILED = 4004,

  // External service errors (5xxx)
  EXTERNAL_SERVICE_ERROR = 5001,
  SUPABASE_ERROR = 5002,
  OPENROUTER_ERROR = 5003,
  HUGGINGFACE_ERROR = 5004,

  // System errors (9xxx)
  INTERNAL_ERROR = 9001,
  TIMEOUT = 9002,
  RATE_LIMITED = 9003,
}

/**
 * Application error with structured context
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly context?: Record<string, unknown>
  public readonly cause?: Error
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    options?: {
      context?: Record<string, unknown>
      cause?: Error
      isOperational?: boolean
    }
  ) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.context = options?.context
    this.cause = options?.cause
    this.isOperational = options?.isOperational ?? true

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * Creates a JSON-serializable representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      ...(process.env.NODE_ENV !== "production" && { stack: this.stack }),
    }
  }

  /**
   * Gets the HTTP status code for this error
   */
  getHttpStatus(): number {
    if (this.code >= 1001 && this.code < 1100) {
      // Auth errors
      return this.code === ErrorCode.FORBIDDEN ? 403 : 401
    }
    if (this.code >= 2001 && this.code < 2100) {
      // Validation errors
      return 400
    }
    if (this.code >= 3001 && this.code < 3100) {
      // Resource errors
      switch (this.code) {
        case ErrorCode.NOT_FOUND:
          return 404
        case ErrorCode.CONFLICT:
        case ErrorCode.ALREADY_EXISTS:
          return 409
        default:
          return 400
      }
    }
    if (this.code >= 4001 && this.code < 4100) {
      // Processing errors
      return 422
    }
    if (this.code >= 5001 && this.code < 5100) {
      // External service errors
      return 502
    }
    if (this.code === ErrorCode.RATE_LIMITED) {
      return 429
    }
    if (this.code === ErrorCode.TIMEOUT) {
      return 504
    }
    // System errors
    return 500
  }
}

/**
 * Factory functions for common errors
 */
export const Errors = {
  unauthorized: (message = "Unauthorized") =>
    new AppError(message, ErrorCode.UNAUTHORIZED),

  forbidden: (message = "Forbidden") =>
    new AppError(message, ErrorCode.FORBIDDEN),

  notFound: (resource: string) =>
    new AppError(`${resource} not found`, ErrorCode.NOT_FOUND, {
      context: { resource },
    }),

  validationError: (message: string, context?: Record<string, unknown>) =>
    new AppError(message, ErrorCode.VALIDATION_ERROR, { context }),

  processingError: (message: string, cause?: Error) =>
    new AppError(message, ErrorCode.PROCESSING_ERROR, { cause }),

  extractionFailed: (message: string, context?: Record<string, unknown>) =>
    new AppError(message, ErrorCode.EXTRACTION_FAILED, { context }),

  externalServiceError: (service: string, message: string, cause?: Error) =>
    new AppError(`${service}: ${message}`, ErrorCode.EXTERNAL_SERVICE_ERROR, {
      context: { service },
      cause,
    }),

  internalError: (message: string, cause?: Error) =>
    new AppError(message, ErrorCode.INTERNAL_ERROR, {
      cause,
      isOperational: false,
    }),
}
