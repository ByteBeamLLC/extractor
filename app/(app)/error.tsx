"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/errorReporting"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app-error]", error)
    reportError(error, {
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center max-w-md">
        <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
        <p className="mt-2 text-sm text-red-600">
          This error has been automatically reported and our team is on it.
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
