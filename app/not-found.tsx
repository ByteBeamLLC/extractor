import Link from "next/link"

// Force dynamic rendering since root layout uses cookies
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground">The page you’re looking for doesn’t exist.</p>
        <Link href="/" className="px-3 py-1.5 border rounded">Go home</Link>
      </div>
    </div>
  )
}

