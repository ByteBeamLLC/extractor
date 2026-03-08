import type { Metadata, Viewport } from "next"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
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
      <body className={`font-sans ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
