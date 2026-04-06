import Link from "next/link"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
