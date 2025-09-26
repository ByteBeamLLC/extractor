import type { StructuredToolInterface } from '@langchain/core/tools'
import { ensureServerOnly } from '@/lib/server/ensureServerOnly'

const MODULE_ID = 'lib/llm/tools/index'

ensureServerOnly(MODULE_ID)

type MaybePromise<T> = Promise<T> | T

export type ToolFactory<TTool extends StructuredToolInterface = StructuredToolInterface> = () => MaybePromise<TTool>

const registry = new Map<string, ToolFactory>()

export function registerTool(name: string, factory: ToolFactory): void {
  if (!name.trim()) {
    throw new Error('[llm][tools] Tool name cannot be empty.')
  }
  registry.set(name, factory)
}

export function unregisterTool(name: string): void {
  registry.delete(name)
}

export function isToolRegistered(name: string): boolean {
  return registry.has(name)
}

export async function loadTool<TTool extends StructuredToolInterface>(name: string): Promise<TTool> {
  const factory = registry.get(name)
  if (!factory) {
    throw new Error(`[llm][tools] Tool "${name}" is not registered.`)
  }

  return (await factory()) as TTool
}

export async function loadTools(names?: string[]): Promise<Record<string, StructuredToolInterface>> {
  const targetNames = names ?? Array.from(registry.keys())
  const entries = await Promise.all(
    targetNames.map(async (toolName) => [toolName, await loadTool(toolName)] as const),
  )

  return Object.fromEntries(entries)
}

export function listRegisteredTools(): string[] {
  return Array.from(registry.keys())
}

export function clearToolsRegistry(): void {
  registry.clear()
}
