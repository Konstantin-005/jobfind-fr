/**
 * @file: app/vakansii/[slug]/page.tsx
 * @description: SSR-страница списка вакансий по городу (city_slug) для маршрута /vakansii/{slug}.
 * @dependencies: none (серверная загрузка через fetch)
 * @created: 2025-11-18
 */
import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import JobFilters from '../../components/JobFilters'

interface JobAddress {
  city?: string
  district?: string
  address?: string
}

interface JobListItem {
  job_id: number
  company_id: number
  company_name: string
  logo_url?: string
  title: string
  work_experience?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_type?: string
  salary_period?: string
  address?: JobAddress
  publication_cities?: string[]
  work_format_ids?: number[]
}

function formatSalary(job: JobListItem) {
  const min = job.salary_min
  const max = job.salary_max
  if (min && max) return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')}`
  if (min) return `от ${min.toLocaleString('ru-RU')}`
  if (max) return `до ${max.toLocaleString('ru-RU')}`
  return ''
}

function getSalaryDetails(job: JobListItem) {
  const periodMap: Record<string, string> = {
    month: 'за месяц',
    hour: 'в час',
    shift: 'смена',
    vahta: 'вахта',
    project: 'проект',
  }
  const typeMap: Record<string, string> = {
    after_tax: 'на руки',
    before_tax: 'до вычета налогов',
  }
  const period = job.salary_period ? periodMap[job.salary_period] : undefined
  const sType = job.salary_type ? typeMap[job.salary_type] : undefined
  return [period, sType].filter(Boolean).join(', ')
}

function getExperienceLabel(value?: string) {
  const map: Record<string, string> = {
    '0': 'без опыта',
    '0_1': 'до 1 года',
    '1_3': 'от 1 до 3 лет',
    '3_5': 'от 3 до 6 лет',
    'more_5': 'более 6 лет',
  }
  return value ? map[value] : undefined
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  let cityPrepositional: string | undefined

  try {
    const res = await fetch(`${origin}/api/dictionaries/cities/by-slug/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })

    if (res.ok) {
      const data = await res.json() as { name_prepositional?: string }
      cityPrepositional = data?.name_prepositional || undefined
    }
  } catch {
    // проглатываем ошибку, используем fallback ниже
  }

  const baseTitle = 'Свежие вакансии от прямых работодателей — E77.top'
  const baseDescription = 'Найдите свою идеальную работу с E77.top: свежие вакансии от прямых работодателей по всей России.'

  const title = cityPrepositional
    ? `Работа в ${cityPrepositional}, свежие вакансии от прямых работодателей на E77.top`
    : baseTitle

  const description = cityPrepositional
    ? `Легко найти работу в ${cityPrepositional} с удобным и понятным поиском. Все вакансии только от проверенных работодателей на E77.top.`
    : baseDescription

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
    },
  }
}

export default async function VacancyBySlugPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`
  const res = await fetch(`${origin}/api/jobs/searchBySlug?city_slug=${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Не удалось загрузить вакансии</div>
      </div>
    )
  }
  const jobs: JobListItem[] = await res.json()

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="flex gap-8">
        <JobFilters />
        <div className="flex-1">
          <div className="bg-white rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="text-gray-700 font-medium">
              Найдено <span className="font-bold">{jobs.length}</span> вакансий
            </div>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center text-gray-500">По вашему запросу вакансий не найдено</div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job.job_id} className="bg-white rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-1">
                      <Link href={`/vacancy/${job.job_id}`} className="text-[#2B81B0] hover:underline">{job.title}</Link>
                    </h2>
                    <div className="text-gray-700 mb-2">{job.company_name}</div>
                    {getExperienceLabel(job.work_experience) && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{getExperienceLabel(job.work_experience)}</span>
                    )}
                    {(() => {
                      const city = job.address?.city
                      const addr = job.address?.address
                      const line = [city, addr].filter(Boolean).join(', ')
                      return line ? (
                        <div className="mt-2 text-gray-600 text-sm flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500" aria-hidden="true">
                            <path d="M12 2.25c-4.28 0-7.75 3.47-7.75 7.75 0 5.81 7.13 11.22 7.43 11.45.2.15.47.15.67 0 .3-.23 7.43-5.64 7.43-11.45 0-4.28-3.47-7.75-7.75-7.75Zm0 10.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                          </svg>
                          <span>{line}</span>
                        </div>
                      ) : null
                    })()}
                    {(job.salary_min || job.salary_max) && (
                      <div className="text-lg font-semibold text-gray-800">
                        {formatSalary(job)} {job.salary_currency === 'RUB' ? '₽' : ''}
                        {getSalaryDetails(job) && <span className="text-gray-600 font-normal"> ({getSalaryDetails(job)})</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 md:ml-4">
                    {job.logo_url && (
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={job.logo_url} alt={job.company_name} className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <button type="button" className="bg-[#2B81B0] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18608a] transition">Откликнуться</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
