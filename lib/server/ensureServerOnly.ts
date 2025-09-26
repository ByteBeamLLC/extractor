const TAG = "[server-only]"

export function ensureServerOnly(moduleId: string) {
  if (typeof window !== "undefined") {
    throw new Error(`${TAG} ${moduleId} was imported in a browser bundle. Move the call to a server entry point.`)
  }
  if (typeof document !== "undefined") {
    throw new Error(`${TAG} ${moduleId} cannot execute in environments that expose the DOM.`)
  }
}
