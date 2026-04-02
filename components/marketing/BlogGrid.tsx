"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface BlogCardData {
  slug: string
  title: string
  excerpt: string
  category: string
  publishedAt: string
  readTime: string
  hasImage: boolean
  href: string
}

export function BlogGrid({
  posts,
  categories,
}: {
  posts: BlogCardData[]
  categories: string[]
}) {
  const [active, setActive] = useState("All")

  const filtered =
    active === "All" ? posts : posts.filter((p) => p.category === active)

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
        {filtered.map((post) => (
          <Link
            key={post.slug}
            href={post.href}
            className="group rounded-xl border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200"
          >
            {/* Image */}
            {post.hasImage ? (
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <Image
                  src={`/images/blog/${post.slug}.webp`}
                  alt={post.title}
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
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                {post.excerpt}
              </p>
              <time
                dateTime={post.publishedAt}
                className="text-xs text-muted-foreground"
              >
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
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
          No posts in this category yet.
        </p>
      )}
    </>
  )
}
