import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getLLMConfig } from '@/lib/llm/config'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('getLLMConfig', () => {
  it('returns defaults when no env vars are present', () => {
    const config = getLLMConfig()

    expect(config.provider).toBe('gemini')
    expect(config.model).toBe('gemini-1.5-flash')
    expect(config.temperature).toBe(0.2)
    expect(config.maxOutputTokens).toBe(2048)
    expect(config.maxRetries).toBe(2)
    expect(config.requestTimeoutMs).toBe(30_000)
    expect(config.apiKey).toBeUndefined()
  })

  it('reads values from env vars and parses numbers', () => {
    process.env.LLM_PROVIDER = 'anthropic'
    process.env.LLM_MODEL = 'claude-3-sonnet'
    process.env.LLM_TEMPERATURE = '0.6'
    process.env.LLM_MAX_OUTPUT_TOKENS = '4096'
    process.env.LLM_MAX_RETRIES = '5'
    process.env.LLM_REQUEST_TIMEOUT_MS = '45000'
    process.env.LLM_API_KEY = 'secret'

    const config = getLLMConfig()

    expect(config.provider).toBe('anthropic')
    expect(config.model).toBe('claude-3-sonnet')
    expect(config.temperature).toBe(0.6)
    expect(config.maxOutputTokens).toBe(4096)
    expect(config.maxRetries).toBe(5)
    expect(config.requestTimeoutMs).toBe(45_000)
    expect(config.apiKey).toBe('secret')
  })

  it('ignores invalid numeric env vars', () => {
    process.env.LLM_TEMPERATURE = 'not-a-number'
    process.env.LLM_MAX_OUTPUT_TOKENS = ''
    process.env.LLM_MAX_RETRIES = 'NaN'
    process.env.LLM_REQUEST_TIMEOUT_MS = 'Infinity'

    const config = getLLMConfig()

    expect(config.temperature).toBe(0.2)
    expect(config.maxOutputTokens).toBe(2048)
    expect(config.maxRetries).toBe(2)
    expect(config.requestTimeoutMs).toBe(30_000)
  })

  it('allows overrides to take precedence over env vars', () => {
    process.env.LLM_TEMPERATURE = '0.9'
    const config = getLLMConfig({ temperature: 0.1, provider: 'gemini' })

    expect(config.temperature).toBe(0.1)
    expect(config.provider).toBe('gemini')
  })
})
