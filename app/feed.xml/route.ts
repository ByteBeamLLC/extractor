import { Feed } from "feed"
import { getAllBlogPosts } from "@/lib/seo/blog-posts"
import { getAllGuides } from "@/lib/seo/guides"
import { alternatives } from "@/lib/seo/alternatives"

const BASE_URL = "https://parsli.co"

export async function GET() {
  const feed = new Feed({
    title: "Parsli",
    description:
      "AI-powered document data extraction — guides, comparisons, and product updates.",
    id: BASE_URL,
    link: BASE_URL,
    language: "en",
    image: `${BASE_URL}/og-image.png`,
    favicon: `${BASE_URL}/parsli-icon.png`,
    copyright: `Copyright ${new Date().getFullYear()} Parsli`,
    updated: new Date(),
    feedLinks: {
      rss2: `${BASE_URL}/feed.xml`,
    },
    author: {
      name: "Talal Bazerbachi",
      link: BASE_URL,
    },
  })

  // Blog posts
  for (const post of getAllBlogPosts()) {
    feed.addItem({
      title: post.title,
      id: `${BASE_URL}/blog/${post.slug}`,
      link: `${BASE_URL}/blog/${post.slug}`,
      description: post.excerpt,
      date: new Date(post.updatedAt),
      published: new Date(post.publishedAt),
      author: [{ name: post.author }],
      category: [{ name: post.category }],
    })
  }

  // Guides
  for (const guide of getAllGuides()) {
    feed.addItem({
      title: guide.title,
      id: `${BASE_URL}/guides/${guide.slug}`,
      link: `${BASE_URL}/guides/${guide.slug}`,
      description: guide.metaDescription,
      date: new Date(guide.updatedAt),
      published: new Date(guide.publishedAt),
      author: [{ name: guide.author }],
      category: [{ name: guide.category }],
    })
  }

  // Comparison pages
  for (const alt of alternatives) {
    feed.addItem({
      title: alt.h1,
      id: `${BASE_URL}/compare/${alt.slug}`,
      link: `${BASE_URL}/compare/${alt.slug}`,
      description: alt.metaDescription,
      date: new Date(alt.updatedAt),
      published: new Date(alt.publishedAt),
    })
  }

  // Sort by most recent first
  feed.items.sort((a, b) => b.date.getTime() - a.date.getTime())

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  })
}
