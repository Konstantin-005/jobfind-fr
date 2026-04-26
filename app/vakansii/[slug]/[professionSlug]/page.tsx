/**
 * @file: app/vakansii/[slug]/[professionSlug]/page.tsx
 * @description: SSR-страница списка вакансий по городу и профессии для маршрута /vakansii/{city_slug}/{profession_slug} с пагинацией.
 * @dependencies: app/vakansii/[slug]/VacancySlugClient, app/components/JobFilters, app/components/Pagination
 * @created: 2026-04-26
 */
import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { cache } from 'react'
import JobFilters from '@/app/components/JobFilters'
import Pagination from '@/app/components/Pagination'
import VacancySlugClient from '../VacancySlugClient'
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
  posted_date?: string
  tv?: boolean
  description?: string
  addresses?: {
    city?: string
    city_name_prepositional?: string
    address?: string
    slug?: string
  }[]
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

interface JobProfessionListItem {
  profession_id: number
  group_id: number
  name: string
  name_prepositional: string
  slug: string
}

interface JobsBySlugResponse {
  items: JobListItem[]
  limit: number
  page: number
  total: number
  profession?: JobProfessionListItem
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
    more_5: 'Опыт от 5 лет',
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

interface CityData {
  name?: string
  name_prepositional?: string
}

const getCityData = cache(async (slug: string, origin: string): Promise<CityData | undefined> => {
  try {
    const res = await fetch(`${origin}/api/dictionaries/cities/by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    })

    if (res.ok) {
      return (await res.json()) as CityData
    }
  } catch (error) {
    console.error('[getCityData] error:', error)
  }
  return undefined
})

function humanizeSlug(value: string) {
  return value.replace(/-/g, ' ')
}

function lowercaseFirst(value: string) {
  if (!value) return value
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function aggregateSalary(jobs: JobListItem[]) {
  const mins = jobs.map((j) => j.salary_min).filter((v): v is number => typeof v === 'number' && v > 0)
  const maxs = jobs.map((j) => j.salary_max).filter((v): v is number => typeof v === 'number' && v > 0)
  const all = [...mins, ...maxs]
  if (all.length === 0) return null
  const min = Math.min(...all)
  const max = Math.max(...all)
  const avg = Math.round(all.reduce((s, v) => s + v, 0) / all.length)
  return { min, max, avg }
}

function toIsoDate(value?: string) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

function addDaysIso(valueIso: string, days: number) {
  const date = new Date(`${valueIso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return undefined
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function pluralizeVacancy(count: number) {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return 'вакансий'
  if (n1 > 1 && n1 < 5) return 'вакансии'
  if (n1 === 1) return 'вакансия'
  return 'вакансий'
}

function buildJsonLd(params: {
  origin: string
  slug: string
  professionSlug: string
  cityName: string | undefined
  cityPrepositional: string | undefined
  professionName: string
  professionLower: string
  jobs: JobListItem[]
  total: number
  salary: ReturnType<typeof aggregateSalary>
}) {
  const { origin, slug, professionSlug, cityName, cityPrepositional, professionName, professionLower, jobs, total, salary } = params
  const siteUrl = origin

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${siteUrl}/` },
      ...(cityName
        ? [{ '@type': 'ListItem', position: 3, name: `Вакансии в ${cityPrepositional || cityName}`, item: `${siteUrl}/vakansii/${slug}` }]
        : []),
      { '@type': 'ListItem', position: cityName ? 4 : 3, name: professionName, item: `${siteUrl}/vakansii/${slug}/${professionSlug}` },
    ],
  }

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cityPrepositional
      ? `Вакансии по профессии ${professionLower} в ${cityPrepositional}`
      : `Вакансии по профессии ${professionLower}`,
    numberOfItems: total,
    ...(salary ? { description: `Зарплата: от ${salary.min.toLocaleString('ru-RU')} до ${salary.max.toLocaleString('ru-RU')} ₽` } : {}),
    itemListElement: jobs.slice(0, 20).map((job, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteUrl}/vacancy/${job.job_id}`,
    })),
  }

  const jobPostings = jobs.slice(0, 20).map((job) => {
    const primary = Array.isArray(job.addresses) && job.addresses.length > 0
      ? (job.addresses.find((a) => a?.slug === slug) || job.addresses[0])
      : undefined

    const datePosted = toIsoDate(job.posted_date)
    const validThrough = datePosted ? addDaysIso(datePosted, 60) : undefined

    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description || '',
      url: `${siteUrl}/vacancy/${job.job_id}`,
      employmentType: 'FULL_TIME',
      ...(datePosted ? { datePosted } : {}),
      ...(validThrough ? { validThrough } : {}),
      ...(job.salary_min || job.salary_max
        ? {
            baseSalary: {
              '@type': 'MonetaryAmount',
              currency: job.salary_currency || 'RUB',
              value: {
                '@type': 'QuantitativeValue',
                ...(job.salary_min ? { minValue: job.salary_min } : {}),
                ...(job.salary_max ? { maxValue: job.salary_max } : {}),
                unitText: job.salary_period === 'hour' ? 'HOUR' : 'MONTH',
              },
            },
          }
        : {}),
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company_name,
      },
      jobLocation: primary
        ? {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: primary.city || '',
              streetAddress: primary.address || '',
              addressCountry: 'RU',
            },
          }
        : undefined,
      ...(job.work_experience ? { experienceRequirements: getExperienceLabel(job.work_experience) } : {}),
    }
  }).filter(Boolean)

  return [breadcrumb, itemList, ...jobPostings]
}

interface JobsBySlug2Result {
  profession?: JobProfessionListItem
  items: JobListItem[]
  total: number
  limit: number
  page: number
}

const fetchJobsBySlug2 = cache(async (
  citySlug: string,
  professionSlug: string,
  origin: string,
  page: number,
  limit: number
): Promise<JobsBySlug2Result> => {
  const empty: JobsBySlug2Result = { items: [], total: 0, limit, page }
  try {
    const res = await fetch(
      `${origin}/api/jobs/searchBySlug2?city_slug=${encodeURIComponent(citySlug)}&profession_slug=${encodeURIComponent(professionSlug)}&page=${page}&limit=${limit}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return empty
    const data = await res.json()
    if (Array.isArray(data)) {
      return { ...empty, items: data, total: data.length }
    }
    if (data && typeof data === 'object' && 'items' in data) {
      const paginated = data as JobsBySlugResponse
      return {
        profession: paginated.profession,
        items: Array.isArray(paginated.items) ? paginated.items : [],
        total: typeof paginated.total === 'number' ? paginated.total : 0,
        limit: typeof paginated.limit === 'number' && paginated.limit > 0 ? paginated.limit : limit,
        page: typeof paginated.page === 'number' ? paginated.page : page,
      }
    }
    if (data && typeof data === 'object' && 'data' in data) {
      const paginated = data as PaginatedResponse
      return {
        ...empty,
        items: Array.isArray(paginated.data) ? paginated.data : [],
        total: typeof paginated.total === 'number' ? paginated.total : 0,
      }
    }
    return empty
  } catch (error) {
    console.error('[fetchJobsBySlug2] error:', error)
    return empty
  }
})

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string; professionSlug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}): Promise<Metadata> {
  const { slug, professionSlug } = params
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  const pageParam = searchParams?.page
  const pageValue = Array.isArray(pageParam) ? pageParam[0] : pageParam
  const page = Number(pageValue) || 1

  const [cityData, jobsResult] = await Promise.all([
    getCityData(slug, origin),
    fetchJobsBySlug2(slug, professionSlug, origin, page, 50),
  ])
  const cityPrepositional = cityData?.name_prepositional
  const professionName = jobsResult.profession?.name || humanizeSlug(professionSlug)
  const professionPrepositional = jobsResult.profession?.name_prepositional || professionName
  const professionLower = lowercaseFirst(professionPrepositional)
  const professionNameLower = lowercaseFirst(professionName)

  const salary = aggregateSalary(jobsResult.items)
  const maxSalaryText = salary?.max ? `${salary.max.toLocaleString('ru-RU')} ₽` : undefined

  const baseTitle = 'Свежие вакансии от прямых работодателей — E77.top'
  const baseDescription = 'Найдите свою идеальную работу с E77.top: свежие вакансии от прямых работодателей по всей России.'

  const title = cityPrepositional
    ? `Работа ${professionLower} в ${cityPrepositional} с зарплатой до${maxSalaryText ? ` ${maxSalaryText}` : ''} - свежие вакансии`
    : baseTitle

  const description = cityPrepositional
    ? `Найти работу ${professionLower} в ${cityPrepositional}: ${jobsResult.total} ${pluralizeVacancy(jobsResult.total)} по профессии ${professionNameLower} ${maxSalaryText ? `с зарплатой до ${maxSalaryText}` : ''}. Удобный поиск и предложения от прямых работодателей.`
    : baseDescription

  const canonicalUrl = `${origin}/vakansii/${slug}/${professionSlug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots:
      page > 1
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
    other:
      page > 1
        ? {
            yandex: 'noindex, nofollow',
          }
        : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
    },
  }
}

export default async function VacancyByCityAndProfessionPage({
  params,
  searchParams,
}: {
  params: { slug: string; professionSlug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { slug, professionSlug } = params
  const page = Number(searchParams.page) || 1
  const limit = 50

  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  const [cityData, jobsResult] = await Promise.all([
    getCityData(slug, origin),
    fetchJobsBySlug2(slug, professionSlug, origin, page, limit),
  ])

  const cityName = cityData?.name
  const cityPrepositional = cityData?.name_prepositional
  const professionName =  jobsResult.profession?.name || humanizeSlug(professionSlug)
  const professionNamePrepositional = jobsResult.profession?.name_prepositional || jobsResult.profession?.name || humanizeSlug(professionSlug)
 
  const professionLower = lowercaseFirst(professionName)
  const professionLowerPrepositional = lowercaseFirst(professionNamePrepositional)
  const jobs = jobsResult.items
  const total = jobsResult.total
  const pageSize = jobsResult.limit > 0 ? jobsResult.limit : limit
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const salary = aggregateSalary(jobs)

  const jsonLdSchemas = buildJsonLd({
    origin, slug, professionSlug, cityName, cityPrepositional,
    professionName, professionLower, jobs, total, salary,
  })

  const h1Text = cityPrepositional
    ? `Работа ${professionNamePrepositional} в ${cityPrepositional} — свежие вакансии`
    : `Вакансии по профессии ${professionLower} — E77.top`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pt-16">
      {jsonLdSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="flex gap-8">
        <JobFilters />
        <div className="flex-1">
          <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-gray-500">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-blue-600">Главная</Link></li>
              {cityName && (
                <>
                  <li aria-hidden="true">›</li>
                  <li><Link href={`/vakansii/${slug}`} className="hover:text-blue-600">Вакансии в {cityPrepositional || cityName}</Link></li>
                </>
              )}
              <li aria-hidden="true">›</li>
              <li aria-current="page" className="text-gray-800 font-medium">{professionName}</li>
            </ol>
          </nav>

          <div className="bg-white rounded-lg p-4 mb-6 flex flex-col gap-2">
            <h1 className="text-xl md:text-2xl font-bold">{h1Text}</h1>
            {salary && (
              <p className="text-gray-600 text-sm">
                Зарплата: от {salary.min.toLocaleString('ru-RU')} до {salary.max.toLocaleString('ru-RU')} ₽
                {salary.avg ? ` (в среднем ${salary.avg.toLocaleString('ru-RU')} ₽)` : ''}
              </p>
            )}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-gray-700 font-medium">
                Найдено: <span className="font-bold">{total}</span> {pluralizeVacancy(total)}
              </div>
              {total > 0 && (
                <div className="text-gray-500 text-sm">
                  {(() => {
                    const ps = limit
                    const from = (page - 1) * ps + 1
                    const to = Math.min(page * ps, total)
                    return `Показаны ${from}–${to} из ${total}`
                  })()}
                </div>
              )}
            </div>
            {total > 0 && cityPrepositional && (
              <p className="text-gray-500 text-sm leading-relaxed">
                {total} {pluralizeVacancy(total)} по профессии {professionLower} в {cityPrepositional}
                {salary ? `. Средняя зарплата: ${salary.avg.toLocaleString('ru-RU')} ₽` : ''}.
                Вакансии от прямых работодателей, обновляются ежедневно.
              </p>
            )}
          </div>

          {jobs.length === 0 ? (
            <div className="text-center text-gray-500">По вашему запросу вакансий не найдено</div>
          ) : (
            <>
              <div className="grid gap-6">
                {jobs.map((job) => {
                  const primaryAddr = Array.isArray(job.addresses) && job.addresses.length > 0
                    ? (job.addresses.find((a) => a?.slug === slug) || job.addresses[0])
                    : undefined

                  const datePostedIso = toIsoDate(job.posted_date)
                  const validThroughIso = datePostedIso ? addDaysIso(datePostedIso, 60) : undefined

                  return (
                    <article
                      key={job.job_id}
                      itemScope
                      itemType="https://schema.org/JobPosting"
                      className="bg-white rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <meta itemProp="employmentType" content="FULL_TIME" />
                      {datePostedIso && <meta itemProp="datePosted" content={datePostedIso} />}
                      {validThroughIso && <meta itemProp="validThrough" content={validThroughIso} />}
                      <div className="flex-1 flex flex-col gap-2">
                        <h2 className="text-xl font-semibold">
                          <Link
                            href={`/vacancy/${job.job_id}`}
                            prefetch={false}
                            className="text-[#2B81B0] hover:underline"
                            itemProp="url"
                          >
                            <span itemProp="title">{job.title}</span>
                          </Link>
                        </h2>

                        {(job.salary_min || job.salary_max) && (
                          <div className="text-lg font-semibold text-gray-800" itemProp="baseSalary" itemScope itemType="https://schema.org/MonetaryAmount">
                            <meta itemProp="currency" content={job.salary_currency || 'RUB'} />
                            <span itemProp="value" itemScope itemType="https://schema.org/QuantitativeValue">
                              {job.salary_min && <meta itemProp="minValue" content={String(job.salary_min)} />}
                              {job.salary_max && <meta itemProp="maxValue" content={String(job.salary_max)} />}
                              <meta itemProp="unitText" content={job.salary_period === 'hour' ? 'HOUR' : 'MONTH'} />
                            </span>
                            {formatSalary(job)} {job.salary_currency === 'RUB' ? '₽' : ''}
                            {getSalaryDetails(job) && (
                              <span className="text-gray-600 font-normal"> ({getSalaryDetails(job)})</span>
                            )}
                          </div>
                        )}
                        {job.tv && <div className="text-xs text-gray-500 -mt-1">вакансия с trudvsem.ru</div>}

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

                        {job.description && (
                          <div className="mt-2 text-gray-700 text-sm leading-relaxed line-clamp-3" itemProp="description">{job.description}</div>
                        )}

                        <span itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization" className="contents">
                          <meta itemProp="name" content={job.company_name} />
                          <Link
                            href={`/companies/${job.company_id}`}
                            prefetch={false}
                            className="text-gray-700 mt-1 hover:underline"
                          >
                            {job.company_name}
                          </Link>
                        </span>

                        {primaryAddr && (() => {
                          const city = primaryAddr.city
                          const addr = primaryAddr.address
                          const line = [city, addr].filter(Boolean).join(', ')

                          return line ? (
                            <div className="mt-1 text-gray-600 text-sm flex items-center gap-1" itemProp="jobLocation" itemScope itemType="https://schema.org/Place">
                              <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress" className="contents">
                                {city && <meta itemProp="addressLocality" content={city} />}
                                {addr && <meta itemProp="streetAddress" content={addr} />}
                                <meta itemProp="addressCountry" content="RU" />
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4 h-4 text-gray-500"
                                aria-hidden="true"
                              >
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
                          <Link
                            href={`/companies/${job.company_id}`}
                            prefetch={false}
                            className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center"
                            aria-label={job.company_name}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={buildCompanyLogoSrc(job.logo_url)}
                              alt={job.company_name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </Link>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={`/vakansii/${slug}/${professionSlug}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
