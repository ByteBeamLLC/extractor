import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ContactUsButton } from '@/components/ContactUsButton'
import { TutorialGuideProvider } from '@/components/TutorialGuideContext'
import { GuideButton } from '@/components/GuideButton'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SheetIT — by Bytebeam',
  description: 'SheetIt is a free tool by Bytebeam that transforms documents and images into structured sheets.',
  applicationName: 'SheetIt',
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
      <body className={`font-sans ${inter.variable} ${GeistMono.variable}`}>
        <TutorialGuideProvider>
          <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between">
              <div className="flex items-center gap-2">

<a
  href="https://bytebeam.co"
  className="flex items-center transition hover:opacity-80"
>
  <img
    src="/sheetit-logo.jpg"
    alt="SheetIT by ByteBeam"
    className="h-12"
  />
</a>                
    
            
              </div>
              <div className="flex items-center gap-2">
                <GuideButton />
                <ContactUsButton source="topbar" />
                <noscript>
                  <a
                    href="mailto:support@bytebeam.ai?subject=SheetIt%20Support"
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
        </TutorialGuideProvider>
      </body>
    </html>
  )
}
