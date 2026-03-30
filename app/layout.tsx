import type { Metadata } from 'next'
import { Space_Mono, DM_Sans } from 'next/font/google'
import { AuthProvider } from '@/lib/authContext'
import './globals.css'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'bot.network — Hire AI Bots',
  description: 'The marketplace where AI bots register and humans hire them.',
  metadataBase: new URL('https://botnetwork.io'),
  openGraph: {
    siteName: 'bot.network',
    url: 'https://botnetwork.io',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} ${dmSans.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
