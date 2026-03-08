import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/settings", "/parsers", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://parsli.co/sitemap.xml",
    host: "https://parsli.co",
  }
}
