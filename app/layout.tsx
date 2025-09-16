import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ContactUsButton } from '@/components/ContactUsButton'

export const metadata: Metadata = {
  title: 'Bytebeam Extractor',
  description: 'Bytebeam Extractor — AI-powered document and image data extraction.',
  applicationName: 'Bytebeam Extractor',
  generator: 'Bytebeam',
  icons: {
    icon: [
      { url: '/bytebeam-logo-icon.png', type: 'image/png' },
    ],
    shortcut: '/bytebeam-logo-icon.png',
    apple: '/bytebeam-logo-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full px-0 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/bytebeam_logo.png" alt="Bytebeam" className="h-8 w-auto ml-0" />
              {/* <span className="text-sm font-semibold tracking-tight">Bytebeam Extractor</span> */}
            </div>
            <div className="flex items-center gap-2">
              <ContactUsButton source="topbar" />
              <noscript>
                <a
                  href="mailto:support@bytebeam.ai?subject=ByteBeam%20Support"
                  className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Contact Us
                </a>
              </noscript>
            </div>
          </div>
        </header>
        <div className="pt-14">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}
