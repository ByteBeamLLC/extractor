/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // ── www → non-www (CDN-level, fires before middleware and page rendering) ──
      // Fixes 40+ GSC "alternate page with proper canonical" + redirect chain errors.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.parsli.co" }],
        destination: "https://parsli.co/:path*",
        permanent: true,
      },

      // ── Old /alternative/ path ──
      {
        source: "/alternative/:slug",
        destination: "/compare/:slug",
        permanent: true,
      },

      // ── LP redirects ──
      {
        source: "/lp/handwriting-to-text",
        destination: "/solutions/handwriting-to-text",
        permanent: true,
      },

      // ── Blog posts in guideSlugs with no content → nearest live page ──
      // These slugs exist in guide-slug-list.ts but have no blog post data,
      // causing 404 at both /blog/[slug] and /guides/[slug].
      {
        source: "/blog/receipt-ocr-guide",
        destination: "/tools/receipt-scanner",
        permanent: true,
      },
      {
        source: "/guides/receipt-ocr-guide",
        destination: "/tools/receipt-scanner",
        permanent: true,
      },
      {
        source: "/blog/how-to-read-bank-statement",
        destination: "/blog/what-is-a-bank-statement",
        permanent: true,
      },
      {
        source: "/guides/how-to-read-bank-statement",
        destination: "/blog/what-is-a-bank-statement",
        permanent: true,
      },
      {
        source: "/blog/ocr-underwriting",
        destination: "/ocr-software",
        permanent: true,
      },
      {
        source: "/guides/ocr-underwriting",
        destination: "/ocr-software",
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      // Mixpanel first-party proxy — bypasses ad blockers
      {
        source: "/mp/lib.min.js",
        destination: "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js",
      },
      {
        source: "/mp/lib.js",
        destination: "https://cdn.mxpnl.com/libs/mixpanel-2-latest.js",
      },
      {
        source: "/mp/decide",
        destination: "https://decide.mixpanel.com/decide",
      },
      {
        source: "/mp/:path*",
        destination: "https://api.mixpanel.com/:path*",
      },
    ]
  },
}

export default nextConfig
