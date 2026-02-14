import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

const VacancyClient = dynamic(() => import('./VacancyClient'), { ssr: false })

export async function generateMetadata({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}): Promise<Metadata> {
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  const pageParam = searchParams?.page
  const pageValue = Array.isArray(pageParam) ? pageParam[0] : pageParam
  const page = Number(pageValue) || 1

  const canonicalUrl = `${origin}/vacancy`

  return {
    alternates: {
      canonical: canonicalUrl,
    },
    robots: page > 1
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
    other: page > 1
      ? {
          yandex: 'noindex, nofollow',
        }
      : undefined,
  }
}

export default function VacancyPage() {
  return <VacancyClient />
}
