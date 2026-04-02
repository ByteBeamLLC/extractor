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
      {
        source: "/alternative/:slug",
        destination: "/compare/:slug",
        permanent: true,
      },
      {
        source: "/lp/handwriting-to-text",
        destination: "/solutions/handwriting-to-text",
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
