import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

const Header = dynamic(() => import('./components/Header'), { ssr: false })
const CookieConsent = dynamic(() => import('./components/CookieConsent'), { ssr: false })
const Footer = dynamic(() => import('./components/Footer'), { ssr: false })

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JobFind - Поиск вакансий',
  description: 'Найдите свою идеальную работу с JobFind',
  keywords: 'вакансии, работа, поиск работы, карьера',
  openGraph: {
    title: 'JobFind - Поиск вакансий',
    description: 'Найдите свою идеальную работу с JobFind',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'JobFind',
    url: 'https://jobfind-fr.vercel.app',
    description: 'Найдите свою идеальную работу с JobFind',
  }

  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  )
} 