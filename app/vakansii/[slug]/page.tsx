/**
 * @file: app/vakansii/[slug]/page.tsx
 * @description: SSR-страница списка вакансий по городу (city_slug) для маршрута /vakansii/{slug} с пагинацией.
 * @dependencies: none (серверная загрузка через fetch)
 * @created: 2025-11-18
 */
import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import JobFilters from '@/app/components/JobFilters'
import Pagination from '@/app/components/Pagination'
import VacancySlugClient from './VacancySlugClient'
import workFormatsConfig from '@/app/config/work_formats_202505222228.json'

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
  // Старое поле address оставляем для обратной совместимости
  address?: {
    city?: string
    district?: string
    address?: string
  }
  // Новый формат: массив адресов вакансии
  addresses?: {
    city?: string
    city_name_prepositional?: string
    address?: string
  }[]
  publication_cities?: string[]
  work_format_ids?: number[]
  is_promo?: boolean
  no_resume_apply?: boolean
}

interface PaginatedResponse {
  data: JobListItem[]
  limit: number
  page: number
  total: number
  total_pages: number
}

const COMPANY_LOGO_PREFIX = '/uploads/companyLogo/'

function buildCompanyLogoSrc(value?: string) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed
  if (/^(data|blob):/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  return `${COMPANY_LOGO_PREFIX}${trimmed}`
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
    month: 'в месяц',
    hour: 'в час',
    shift: 'за смену',
    vahta: 'за вахту',
    project: 'за проект',
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
    '0': 'Без опыта',
    '0_1': 'Опыт до 1 года',
    '1_3': 'Опыт 1-3 года',
    '3_5': 'Опыт 3-5 лет',
    'more_5': 'Опыт от 5 лет',
  }
  return value ? map[value] : undefined
}

const workFormatsMap: Record<number, string> = (workFormatsConfig as any)?.work_formats?.reduce(
  (acc: Record<number, string>, wf: any) => {
    if (wf && typeof wf.work_format_id === 'number' && typeof wf.name === 'string') {
      acc[wf.work_format_id] = wf.name
    }
    return acc
  },
  {}
) || {}

function getWorkFormatLabels(ids?: number[]) {
  const allowedIds = new Set<number>([1, 2, 4])
  return (ids || [])
    .filter((id) => allowedIds.has(id))
    .map((id) => workFormatsMap[id])
    .filter(Boolean)
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

  const canonicalUrl = `${origin}/vakansii/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
    },
  }
}

export default async function VacancyBySlugPage({ 
  params,
  searchParams
}: { 
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { slug } = params
  const page = Number(searchParams.page) || 1
  const limit = 50
  
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  // Получаем город в предложном падеже для заголовка H1 (аналогично generateMetadata)
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
    // используем fallback ниже, если город не найден
  }

  const res = await fetch(`${origin}/api/jobs/searchBySlug?city_slug=${encodeURIComponent(slug)}&page=${page}&limit=${limit}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Не удалось загрузить вакансии</div>
      </div>
    )
  }
  
  const responseData = await res.json()
  let jobs: JobListItem[] = []
  let totalPages = 1
  let total = 0

  if (Array.isArray(responseData)) {
     jobs = responseData
     total = jobs.length
  } else {
     const paginated = responseData as PaginatedResponse
     jobs = paginated.data || []
     totalPages = paginated.total_pages || 1
     total = paginated.total || 0
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pt-16">
      <div className="flex gap-8">
        <JobFilters />
        <div className="flex-1">
          <div className="bg-white rounded-lg p-4 mb-6 flex flex-col gap-2">
            {cityPrepositional && (
              <h1 className="text-xl md:text-xl font-bold">
                {`Работа в ${cityPrepositional} - вакансии от прямых работодателей`}
              </h1>
            )}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-gray-700 font-medium">
                Найдено <span className="font-bold">{total}</span> вакансий
              </div>
              {total > 0 && (
                <div className="text-gray-500 text-sm">
                  {(() => {
                    const pageSize = limit
                    const from = (page - 1) * pageSize + 1
                    const to = Math.min(page * pageSize, total)
                    return `Показаны ${from}–${to} из ${total}`
                  })()}
                </div>
              )}
            </div>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center text-gray-500">По вашему запросу вакансий не найдено</div>
          ) : (
            <>
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job.job_id} className="bg-white rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <h2 className="text-xl font-semibold">
                      <Link href={`/vacancy/${job.job_id}`} className="text-[#2B81B0] hover:underline">{job.title}</Link>
                    </h2>

                    {(job.salary_min || job.salary_max) && (
                      <div className="text-lg font-semibold text-gray-800">
                        {formatSalary(job)} {job.salary_currency === 'RUB' ? '₽' : ''}
                        {getSalaryDetails(job) && <span className="text-gray-600 font-normal"> ({getSalaryDetails(job)})</span>}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-1">
                      {getExperienceLabel(job.work_experience) && (
                        <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm max-w-max">
                          {getExperienceLabel(job.work_experience)}
                        </span>
                      )}
                      {getWorkFormatLabels(job.work_format_ids).map((name) => (
                        <span key={name} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                          {name}
                        </span>
                      ))}
                    </div>

                    <div className="text-gray-700 mt-1">{job.company_name}</div>

                    {(() => {
                      const primary = Array.isArray(job.addresses) && job.addresses.length > 0
                        ? job.addresses[0]
                        : job.address || undefined
                      const city = primary?.city
                      const addr = primary?.address
                      const line = [city, addr].filter(Boolean).join(', ')
                      return line ? (
                        <div className="mt-1 text-gray-600 text-sm flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500" aria-hidden="true">
                            <path d="M12 2.25c-4.28 0-7.75 3.47-7.75 7.75 0 5.81 7.13 11.22 7.43 11.45.2.15.47.15.67 0 .3-.23 7.43-5.64 7.43-11.45 0-4.28-3.47-7.75-7.75-7.75Zm0 10.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                          </svg>
                          <span>{line}</span>
                        </div>
                      ) : null
                    })()}

                    <div className="mt-3">
                      <VacancySlugClient 
                        jobId={job.job_id}
                        jobTitle={job.title}
                        isPromo={job.is_promo || false}
                        noResumeApply={job.no_resume_apply}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-4 md:ml-4">
                    {job.logo_url && (
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={buildCompanyLogoSrc(job.logo_url)} alt={job.company_name} className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              basePath={`/vakansii/${slug}`} 
            />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
