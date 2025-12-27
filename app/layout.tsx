import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'
import ClientLayout from './client-layout'

const CookieConsent = dynamic(() => import('./components/CookieConsent'), { ssr: true })
const Footer = dynamic(() => import('./components/Footer'), { ssr: true })

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Поиск свежих вакансий от прямых работодателей - E77.top',
  description: 'Найдите свою идеальную работу с E77.top ',
  openGraph: {
    title: 'Поиск свежих вакансий от прямых работодателей - E77.top',
    description: 'Найдите свою идеальную работу с E77.top ',
    type: 'website',
    locale: 'ru_RU',
  },
  icons: {
    icon: [
      { url: '/favicon-48x48.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/favicon-120x120.png', sizes: '120x120', type: 'image/png' },
    ],
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
        <ClientLayout>
          <div className="min-h-screen bg-gray-200">
            {children}
          </div>
        </ClientLayout>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  )
} 