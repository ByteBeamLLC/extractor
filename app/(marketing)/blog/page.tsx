import type { Metadata } from "next"
import Link from "next/link"
import { getAllBlogPosts } from "@/lib/seo/blog-posts"

export const metadata: Metadata = {
  title: "Blog - Parsli",
  description:
    "Guides, comparisons, and tips for document data extraction. Learn how to extract data from PDFs, automate invoice processing, and more.",
  alternates: {
    canonical: "https://parsli.co/blog",
  },
  openGraph: {
    title: "Blog - Parsli",
    description:
      "Guides, comparisons, and tips for document data extraction.",
    url: "https://parsli.co/blog",
  },
}

export default function BlogIndexPage() {
  const posts = getAllBlogPosts()

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Guides, comparisons, and tips for document data extraction
          </p>
        </div>
      </section>

      {/* Blog post grid */}
      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-xl border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span aria-hidden="true">&middot;</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
