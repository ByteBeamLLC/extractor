"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AccountMenu } from "@/components/auth/AccountMenu"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Parsers", href: "/extractor" },
  { label: "Docs", href: "/extractor/docs" },
  { label: "Pricing", href: "/extractor/pricing" },
]

export function ExtractorNav() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/extractor" className="flex items-center gap-2 transition hover:opacity-80">
            <img src="/bytebeam_logo.png" alt="Bytebeam" className="h-10" />
            <span className="text-sm font-semibold text-muted-foreground border-l pl-2 ml-1">
              Extractor
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/extractor"
                  ? pathname === "/extractor" || pathname?.startsWith("/extractor/parsers")
                  : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://bytebeam.co"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by Bytebeam
          </a>
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
