import type { MetadataRoute } from "next"

const DISALLOW = ["/dashboard", "/settings", "/parsers", "/api/", "/auth/"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      // OpenAI / ChatGPT
      { userAgent: "GPTBot", allow: "/", disallow: DISALLOW },
      { userAgent: "ChatGPT-User", allow: "/", disallow: DISALLOW },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: DISALLOW },
      // Anthropic / Claude
      { userAgent: "anthropic-ai", allow: "/", disallow: DISALLOW },
      { userAgent: "ClaudeBot", allow: "/", disallow: DISALLOW },
      { userAgent: "Claude-Web", allow: "/", disallow: DISALLOW },
      // Google AI (Gemini, SGE)
      { userAgent: "Google-Extended", allow: "/", disallow: DISALLOW },
      // Perplexity
      { userAgent: "PerplexityBot", allow: "/", disallow: DISALLOW },
      // Meta AI
      { userAgent: "FacebookBot", allow: "/", disallow: DISALLOW },
      // Cohere
      { userAgent: "cohere-ai", allow: "/", disallow: DISALLOW },
      // Common Crawl (trains many LLMs)
      { userAgent: "CCBot", allow: "/", disallow: DISALLOW },
      // Mistral / Le Chat
      { userAgent: "MistralBot", allow: "/", disallow: DISALLOW },
      // Brave Search AI
      { userAgent: "Brave-Search", allow: "/", disallow: DISALLOW },
      // You.com
      { userAgent: "YouBot", allow: "/", disallow: DISALLOW },
    ],
    sitemap: "https://parsli.co/sitemap.xml",
    host: "https://parsli.co",
  }
}
