"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface GuideCardData {
  slug: string
  title: string
  description: string
  category: string
  publishedAt: string
  readTime: string
  hasImage: boolean
}

export function GuideGrid({
  guides,
  categories,
}: {
  guides: GuideCardData[]
  categories: string[]
}) {
  const [active, setActive] = useState("All")

  const filtered =
    active === "All" ? guides : guides.filter((g) => g.category === active)

  return (
    <>
      {/* Category filter tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              active === cat
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3-column card grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group rounded-xl border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200"
          >
            {/* Image */}
            {guide.hasImage ? (
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <Image
                  src={`/images/guides/${guide.slug}.webp`}
                  alt={guide.title}
                  width={480}
                  height={270}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
            )}

            {/* Content */}
            <div className="p-5">
              <h2 className="text-base font-semibold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {guide.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                {guide.description}
              </p>
              <time
                dateTime={guide.publishedAt}
                className="text-xs text-muted-foreground"
              >
                {new Date(guide.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No guides in this category yet.
        </p>
      )}
    </>
  )
}
