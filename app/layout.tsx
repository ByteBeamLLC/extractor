import type { Metadata, Viewport } from "next"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider"
import { CTATracker } from "@/components/providers/CTATracker"
import { ErrorReportingInit } from "@/components/ErrorReportingInit"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL("https://parsli.co"),
  title: {
    default: "Parsli - AI Document Data Extraction",
    template: "%s | Parsli",
  },
  description:
    "Extract structured data from PDFs, invoices, emails, and documents automatically with AI. No-code interface with Google Sheets, Zapier, and API integrations.",
  applicationName: "Parsli",
  keywords: [
    "document parsing",
    "pdf data extraction",
    "AI data extraction",
    "invoice parsing",
    "no-code document parser",
    "email parser",
    "document automation",
  ],
  authors: [{ name: "Parsli" }],
  creator: "Parsli",
  publisher: "Parsli",
  icons: {
    icon: [{ url: "/parsli-icon.png", type: "image/png" }],
    shortcut: "/parsli-icon.png",
    apple: "/parsli-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://parsli.co",
    siteName: "Parsli",
    title: "Parsli - AI-Powered Document Data Extraction",
    description:
      "Extract structured data from any document with AI. No code required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Parsli - AI Document Data Extraction",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Parsli - AI Document Data Extraction",
    description:
      "Extract structured data from any document with AI. No code required.",
    images: ["/og-image.png"],
  },
  alternates: {
    types: {
      "application/rss+xml": "https://parsli.co/feed.xml",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script id="gtm-head" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');`}
          </Script>
        )}
      </head>
      <body className={`font-sans ${GeistMono.variable}`}>
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <AnalyticsProvider />
        <CTATracker />
        <ErrorReportingInit />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
