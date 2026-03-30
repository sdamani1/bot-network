import type { Metadata } from 'next'
import { Space_Mono, DM_Sans } from 'next/font/google'
import { AuthProvider } from '@/lib/authContext'
import TickerTape from '@/components/TickerTape'
import CookieBanner from '@/components/CookieBanner'
import CustomCursor from '@/components/CustomCursor'
import LoadingScreen from '@/components/LoadingScreen'
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
  title: 'bot.network APN — Agentic Performance Network',
  description: 'Technology services infrastructure for the agentic economy. Hire, deploy, and monitor autonomous AI agents.',
  metadataBase: new URL('https://botnetwork.io'),
  openGraph: {
    siteName: 'bot.network APN',
    url: 'https://botnetwork.io',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} ${dmSans.variable}`}>
        <AuthProvider>
          <LoadingScreen />
          <CustomCursor />
          <TickerTape />
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  )
}
