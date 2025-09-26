export interface SerializedFile {
  name: string
  type: string
  size: number
  data: string
}

export interface ApiSuccessEnvelope<T> {
  success: true
  data: T
  [key: string]: any
}

export interface ApiErrorEnvelope {
  success: false
  error?: string
  [key: string]: any
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope
