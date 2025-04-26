import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
} 