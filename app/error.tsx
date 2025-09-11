"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("App error:", error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">An unexpected error occurred. You can try again or return home.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => reset()} className="px-3 py-1.5 border rounded">Try again</button>
            <Link href="/" className="px-3 py-1.5 border rounded">Go home</Link>
          </div>
        </div>
      </body>
    </html>
  )
}

