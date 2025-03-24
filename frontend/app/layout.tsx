import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

import { ThemeProvider } from '@/components/theme-provider'
import { GoogleOAuthProvider } from '@react-oauth/google'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Stonks!',
  description: 'Stonks is a game ....', // TODO
  keywords: ['bitcoin', 'trading option', 'stonks'],
  // metadataBase: new URL('https://baseconverter.net'),
  // openGraph: {
  //   title: 'BaseConverter.net: Convert Binary, Hex, Decimal, and More',
  //   description:
  //     'BaseConverter.net is the ultimate number base conversion tool, letting you easily convert between standard bases and your own custom bases. Fractional parts and repeating decimals are supported.',
  //   url: 'https://baseconverter.net',
  //   siteName: 'BaseConverter.net',
  //   // images: [
  //   //   {
  //   //     url: 'https://baseconverter.net/og-image.png',
  //   //     width: 1200,
  //   //     height: 630,
  //   //     alt: 'BaseConverter.net - Number Base Conversion Tool',
  //   //   },
  //   // ],
  //   locale: 'en_US',
  //   type: 'website',
  // },
  robots: {
    index: true,
    follow: true,
  },
  // icons: {
  //   icon: '/favicon.ico', // Path to your favicon
  //   apple: '/apple-touch-icon.png', // Path to your Apple Touch icon
  // },
}

export const viewport: Viewport = {
  themeColor: '#e45c08', // or your brand color
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased touch-manipulation`}
      >
        <GoogleOAuthProvider clientId="889997800293-fikcmtjenq3m21uvi2unsdsmd8pujgkn.apps.googleusercontent.com">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={'loading'}>{children}</Suspense>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
