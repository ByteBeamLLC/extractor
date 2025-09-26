import { ChatGoogleGenerativeAI, type GoogleGenerativeAIChatInput } from '@langchain/google-genai'
import { ensureServerOnly } from '@/lib/server/ensureServerOnly'
import { getLLMConfig } from '@/lib/llm/config'

const MODULE_ID = 'lib/llm/providers/gemini'

ensureServerOnly(MODULE_ID)

export interface GeminiChatModelOptions extends Partial<GoogleGenerativeAIChatInput> {
  requestTimeoutMs?: number
}

export interface GeminiChatModelInstance {
  model: ChatGoogleGenerativeAI
  requestTimeoutMs: number
}

export function createGeminiChatModel(overrides: GeminiChatModelOptions = {}): GeminiChatModelInstance {
  const {
    requestTimeoutMs: requestTimeoutOverride,
    model: _modelOverride,
    temperature: _temperatureOverride,
    maxOutputTokens: _maxOutputTokensOverride,
    maxRetries: _maxRetriesOverride,
    apiKey: _apiKeyOverride,
    ...remainingOverrides
  } = overrides

  const baseConfig = getLLMConfig({
    provider: 'gemini',
    model: _modelOverride,
    temperature: _temperatureOverride,
    maxOutputTokens: _maxOutputTokensOverride,
    maxRetries: _maxRetriesOverride,
    requestTimeoutMs: requestTimeoutOverride,
    apiKey: _apiKeyOverride,
  })

  const apiKey =
    _apiKeyOverride ?? baseConfig.apiKey ?? process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY

  if (!apiKey) {
    throw new Error('[llm][gemini] Missing API key. Set LLM_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENAI_API_KEY.')
  }

  const chatOptions: GoogleGenerativeAIChatInput = {
    ...remainingOverrides,
    apiKey,
    model: baseConfig.model,
    temperature: baseConfig.temperature,
    maxOutputTokens: baseConfig.maxOutputTokens,
    maxRetries: baseConfig.maxRetries,
  }

  const model = new ChatGoogleGenerativeAI(chatOptions)

  return {
    model,
    requestTimeoutMs: baseConfig.requestTimeoutMs,
  }
}

export type GeminiChatModel = ChatGoogleGenerativeAI
