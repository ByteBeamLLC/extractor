import { ensureServerOnly } from '@/lib/server/ensureServerOnly'

const MODULE_ID = 'lib/llm/config'

ensureServerOnly(MODULE_ID)

export type LLMProvider = 'gemini' | string

export interface LLMConfig {
  provider: LLMProvider
  model: string
  temperature: number
  maxOutputTokens: number
  maxRetries: number
  requestTimeoutMs: number
  apiKey?: string
}

const DEFAULT_CONFIG: LLMConfig = {
  provider: 'gemini',
  model: 'gemini-2.5-pro',
  temperature: 0.2,
  maxOutputTokens: 2048,
  maxRetries: 2,
  requestTimeoutMs: 30_000,
  apiKey: undefined,
}

function readStringEnv(key: string): string | undefined {
  const raw = process.env[key]
  if (raw == null) return undefined
  const value = raw.trim()
  return value === '' ? undefined : value
}

function readNumberEnv(key: string): number | undefined {
  const value = readStringEnv(key)
  if (value == null) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

export function getLLMConfig(overrides: Partial<LLMConfig> = {}): LLMConfig {
  return {
    provider: overrides.provider ?? readStringEnv('LLM_PROVIDER') ?? DEFAULT_CONFIG.provider,
    model: overrides.model ?? readStringEnv('LLM_MODEL') ?? DEFAULT_CONFIG.model,
    temperature: overrides.temperature ?? readNumberEnv('LLM_TEMPERATURE') ?? DEFAULT_CONFIG.temperature,
    maxOutputTokens:
      overrides.maxOutputTokens ?? readNumberEnv('LLM_MAX_OUTPUT_TOKENS') ?? DEFAULT_CONFIG.maxOutputTokens,
    maxRetries: overrides.maxRetries ?? readNumberEnv('LLM_MAX_RETRIES') ?? DEFAULT_CONFIG.maxRetries,
    requestTimeoutMs:
      overrides.requestTimeoutMs ?? readNumberEnv('LLM_REQUEST_TIMEOUT_MS') ?? DEFAULT_CONFIG.requestTimeoutMs,
    apiKey: overrides.apiKey ?? readStringEnv('LLM_API_KEY') ?? DEFAULT_CONFIG.apiKey,
  }
}

export function getProviderConfig(provider?: string) {
  const config = getLLMConfig(provider ? { provider } : {})
  return config
}

