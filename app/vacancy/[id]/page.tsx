/**
 * @file: app/vacancy/[id]/page.tsx
 * @description: Страница детального просмотра вакансии с SSR, хлебными крошками и кнопкой «Откликнуться»
 * @dependencies: app/config/api.ts (API_ENDPOINTS.jobById)
 * @created: 2025-11-10
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { API_ENDPOINTS } from '../../config/api'
import { headers } from 'next/headers'
import VacancyDetailClient from './VacancyDetailClient'

interface City { city_id?: number; id?: number; name?: string; name_prepositional?: string }
interface CompanyProfile { company_name?: string; logo_url?: string }
interface VacancyAddress { city?: string; city_name_prepositional?: string; district?: string; address?: string }
interface Region { region_id?: number; name?: string }
interface Skill { skill_id?: number; name?: string }
interface NamedId {
  id?: number
  name?: string
  [key: string]: any
}
interface VacancyProfession extends NamedId {
  profession_id?: number
}
interface JobUser {
  user_id?: string
  email?: string
  name?: string
}
interface JobPosting {
  job_id: number
  title: string
  description?: string
  company_profile?: CompanyProfile | null
  company_id?: number
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  salary_type?: string
  salary_frequency?: string
  work_experience?: string
  work_formats?: NamedId[]
  employment_types?: NamedId[]
  work_schedules?: NamedId[]
  day_lengths?: NamedId[]
  shift_types?: NamedId[]
  education_types?: NamedId[]
  posted_date?: string
  created_at?: string
  expiration_date?: string
  updated_at?: string
  experience_level?: string
  is_active?: boolean
  is_contract_possible?: boolean
  is_promo?: boolean
  deleted?: boolean
  publish_in_all_cities?: boolean
  link?: string
  posted_by?: string
  no_resume_apply?: boolean
  profession?: VacancyProfession | null
  profession_id?: number
  addresses?: VacancyAddress[]
  regions?: Region[]
  skills?: Skill[]
  user?: JobUser | null
  work_schedule_types?: NamedId[]
}

const EMPLOYMENT_TYPE_SCHEMA_MAP: Record<number, string> = {
  1: 'FULL_TIME',
  2: 'PART_TIME',
  3: 'CONTRACTOR',
  4: 'INTERN',
  5: 'VOLUNTEER',
}

const salaryPeriodMap: Record<string, string> = {
  month: 'в месяц',
  hour: 'в час',
  shift: 'за смену',
  vahta: 'за вахту',
  project: 'за проект',
}
const salaryTypeMap: Record<string, string> = {
  after_tax: 'на руки',
  before_tax: 'до вычета налогов',
}
const salaryFrequencyMap: Record<string, string> = {
  month: 'раз в месяц',
  'раз в месяц': 'раз в месяц',
  '2_month': 'два раза в месяц',
  '2 раза в месяц': 'два раза в месяц',
  day: 'ежедневно',
  ежедневно: 'ежедневно',
  other: 'по договоренности',
  другое: 'по договоренности',
}
const workExperienceMap: Record<string, string> = {
  '0': 'без опыта',
  '0_1': 'до 1 года',
  '1_3': 'от 1 до 3 лет',
  '3_5': 'от 3 до 5 лет',
  'more_5': 'более 5 лет',
}

function formatSalary(job: JobPosting) {
  const { salary_min: min, salary_max: max, salary_currency: cur } = job
  const range = min && max
    ? `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')}`
    : min
      ? `от ${min.toLocaleString('ru-RU')}`
      : max
        ? `до ${max.toLocaleString('ru-RU')}`
        : ''

  // Если нет числового значения (min/max), не показываем блок зарплаты и не выводим одну только валюту
  if (!range) return ''

  const currency = cur === 'RUB' ? '₽' : (cur || '')
  return [range, currency].filter(Boolean).join(' ')
}
function getSalaryDetails(job: JobPosting) {
  const period = job.salary_period ? salaryPeriodMap[job.salary_period] : undefined
  const stype = job.salary_type ? salaryTypeMap[job.salary_type] : undefined
  return [period, stype].filter(Boolean).join(', ')
}

function formatSalaryFrequency(value?: string) {
  if (!value) return undefined
  const normalized = value.toLowerCase()
  if (salaryFrequencyMap[normalized]) {
    return salaryFrequencyMap[normalized]
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function chipsFrom(names?: NamedId[]) {
  return (names || []).map(n => n?.name).filter(Boolean) as string[]
}

function getPrimaryCity(job: JobPosting) {
  const addresses = job.addresses || []
  if (addresses.length === 1) {
    return addresses[0]?.city || ''
  }
  return ''
}

function getCityPrepositional(job: JobPosting) {
  const addresses = job.addresses || []
  if (addresses.length === 1) {
    const addr = addresses[0] || {}
    return addr.city_name_prepositional || addr.city || ''
  }
  return ''
}

function formatMoney(value?: number, currency?: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined
  }
  const normalizedCurrency = currency === 'RUB' || currency === 'RUR' ? '₽' : (currency || '')
  const formattedValue = value.toLocaleString('ru-RU')
  return [formattedValue, normalizedCurrency].filter(Boolean).join(' ').trim()
}

function formatMetaDate(value?: string) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function buildTitleSalarySegment(job: JobPosting) {
  const salaryCurrency = job.salary_currency
  const max = formatMoney(job.salary_max, salaryCurrency)
  if (max) {
    return `с зарплатой до ${max}`
  }
  const min = formatMoney(job.salary_min, salaryCurrency)
  if (min) {
    return `с зарплатой ${min}`
  }
  return undefined
}

function getDescriptionSalaryValue(job: JobPosting) {
  const salaryCurrency = job.salary_currency
  return formatMoney(
    typeof job.salary_max === 'number' ? job.salary_max : job.salary_min,
    salaryCurrency,
  )
}

function buildVacancyMetaTitle(job: JobPosting) {
  const city = getCityPrepositional(job)
  const companyName = job.company_profile?.company_name?.trim()
  const salarySegment = buildTitleSalarySegment(job)
  const parts = [`Вакансия ${job.title}`]
  if (city) {
    parts.push(`в ${city}`)
  }
  if (salarySegment) {
    parts.push(salarySegment)
  }
  const baseTitle = parts.join(' ')
  const companyPart = companyName ? `, работа в компании ${companyName}` : ''
  return `${baseTitle}${companyPart}`.trim()
}

function buildVacancyMetaDescription(job: JobPosting) {
  const city = getCityPrepositional(job)
  const companyName = job.company_profile?.company_name?.trim()
  const dateLabel = formatMetaDate(job.updated_at || job.posted_date)
  const experience = job.work_experience ? workExperienceMap[job.work_experience] : undefined
  const firstSentenceParts = [
    `Вакансия ${job.title}`,
    companyName ? `от компании ${companyName}` : undefined,
    city ? `в ${city}` : undefined,
    dateLabel ? `от ${dateLabel}` : undefined,
  ].filter(Boolean)
  const firstSentence = firstSentenceParts.join(' ')

  const salaryValue = getDescriptionSalaryValue(job)
  const salarySentence = salaryValue
    ? `Предлагаемая зарплата ${salaryValue}`
    : 'Предлагаемая зарплата не указана'
  const experienceSentence = experience
    ? `требуется опыт работы ${experience}`
    : 'требуется опыт работы не указан'

  const secondSentence = `${salarySentence}, ${experienceSentence}`
  return `${firstSentence}. ${secondSentence}`.trim()
}

function buildVacancyKeywords(job: JobPosting) {
  const keywords = ['вакансия', 'работа']
  if (job.title) keywords.push(job.title)
  if (job.company_profile?.company_name) keywords.push(job.company_profile.company_name)
  const addr = (job.addresses || [])
  if (addr.length === 1 && addr[0]?.city) keywords.push(addr[0].city!)
  return keywords
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

export default async function VacancyPage({ params }: { params: { id: string } }) {
  const idNum = Number(params.id)
  if (!Number.isFinite(idNum)) {
    notFound()
  }

  const h = headers()
  const proto = h.get('x-forwarded-proto') || 'http'
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000'
  const absUrl = new URL(API_ENDPOINTS.jobById(idNum), `${proto}://${host}`)
  let job: JobPosting | null = null
  let loadError = false
  try {
    const res = await fetch(absUrl.toString(), { cache: 'no-store' })
    if (res.status === 404) {
      notFound()
    }
    if (!res.ok) {
      throw new Error('Failed to load job')
    }
    job = await res.json()
  } catch (error) {
    console.error('[VacancyPage] job load failed', error)
    loadError = true
  }

  if (loadError || !job) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-10 pt-20">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold mb-3">Вакансия недоступна</h1>
              <p className="text-gray-600 text-sm md:text-base">
                Не удалось получить данные вакансии. Пожалуйста, попробуйте позже или обновите страницу.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const title = job.title
  const salary = formatSalary(job)
  const salaryDetails = getSalaryDetails(job)
  const salaryFrequency = formatSalaryFrequency(job.salary_frequency)
  const companyName = job.company_profile?.company_name || ''
  const logoUrl = job.company_profile?.logo_url
  const addresses = job.addresses || []
  const primaryAddress = addresses[0]
  const city = primaryAddress?.city || ''
  const district = primaryAddress?.district || ''
  const streetAddress = primaryAddress?.address || ''
  const addressLine = [city, district, streetAddress].filter(Boolean).join(', ')
  const experience = job.work_experience ? workExperienceMap[job.work_experience] : undefined
  const workFormats = chipsFrom(job.work_formats)
  const employment = chipsFrom(job.employment_types)
  const workScheduleTypes = chipsFrom(job.work_schedule_types)
  const workSchedules = chipsFrom(job.work_schedules)
  const workDayLengths = chipsFrom(job.day_lengths)
  const shiftTypes = chipsFrom(job.shift_types)
  const educationTypes = chipsFrom(job.education_types)
  const isPromo = Boolean(job.is_promo && job.link)
  const promoRedirectPath = isPromo ? `/vacancy/${job.job_id}/to` : null
  const remoteFormatId = 1
  const hasRemoteFormat = (job.work_formats || []).some((format) => {
    if (!format) return false
    if (format.work_format_id && Number(format.work_format_id) === remoteFormatId) return true
    if (format.id && Number(format.id) === remoteFormatId) return true
    return typeof format.name === 'string' && format.name.toLowerCase().includes('удал')
  })

  const employmentSchemaValues = Array.from(
    new Set(
      (job.employment_types || [])
        .map((item) => {
          if (!item) return undefined
          const rawId = item.employment_type_id ?? item.id
          if (typeof rawId === 'number' || typeof rawId === 'string') {
            const normalizedId = Number(rawId)
            if (Number.isFinite(normalizedId)) {
              return EMPLOYMENT_TYPE_SCHEMA_MAP[normalizedId]
            }
          }
          const label = item.name?.toLowerCase()
          if (!label) return undefined
          if (label.includes('полная')) return 'FULL_TIME'
          if (label.includes('частич')) return 'PART_TIME'
          if (label.includes('проект')) return 'CONTRACTOR'
          if (label.includes('стаж')) return 'INTERN'
          if (label.includes('волонт')) return 'VOLUNTEER'
          return undefined
        })
        .filter(Boolean) as string[]
    )
  )

  const salaryUnitMap: Record<string, string> = {
    hour: 'HOUR',
    day: 'DAY',
    week: 'WEEK',
    month: 'MONTH',
    year: 'YEAR',
  }
  const salaryUnit = job.salary_period ? salaryUnitMap[job.salary_period] : undefined
  const salaryValue: Record<string, number | string> = { '@type': 'QuantitativeValue' }
  if (job.salary_min && job.salary_max) {
    salaryValue.minValue = job.salary_min
    salaryValue.maxValue = job.salary_max
  } else if (job.salary_min) {
    salaryValue.value = job.salary_min
  } else if (job.salary_max) {
    salaryValue.value = job.salary_max
  }
  if (salaryUnit) {
    salaryValue.unitText = salaryUnit
  }
  const baseSalary = salaryValue.value || salaryValue.minValue || salaryValue.maxValue
    ? {
        '@type': 'MonetaryAmount',
        currency: job.salary_currency || 'RUB',
        value: salaryValue,
      }
    : undefined

  const postalAddresses = addresses.length
    ? addresses.map(addr => ({
        '@type': 'PostalAddress',
        streetAddress: addr.address || undefined,
        addressLocality: addr.city || undefined,
        addressRegion: addr.district || undefined,
        addressCountry: 'RU',
      }))
    : [{
        '@type': 'PostalAddress',
        addressCountry: 'RU',
      }]

  const jobLocation = !hasRemoteFormat
    ? postalAddresses.map(address => ({
        '@type': 'Place',
        address,
      }))
    : undefined

  const schemaDescription = job.description || undefined

  const applicantLocationRequirements = hasRemoteFormat
    ? {
        '@type': 'Country',
        name: 'RU',
      }
    : undefined

  const protocol = proto
  const hostname = host
  const jobUrl = `${protocol}://${hostname}/vacancy/${idNum}`
  const datePosted = (() => {
    const base = new Date()
    base.setDate(base.getDate() - 1)
    return base.toISOString()
  })()
  const validThrough = (() => {
    const base = new Date()
    base.setDate(base.getDate() + 30)
    return base.toISOString()
  })()

  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description: schemaDescription || undefined,
    datePosted,
    validThrough,
    employmentType: employmentSchemaValues.length ? employmentSchemaValues : undefined,
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName || 'confidential',
    },
    jobLocation,
    jobLocationType: hasRemoteFormat ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements,
    baseSalary,
    url: jobUrl,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-10 pt-20">
      {/* Хлебные крошки */}
      <nav className="text-xs md:text-sm text-gray-500 mb-3 md:mb-5">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">Главная</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/vacancy" className="hover:underline">Вакансии</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-700 line-clamp-1" title={title}>{title}</li>
        </ol>
      </nav>

      {/* Единый блок информации о вакансии */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-6 md:mb-8">
        <h1 className="text-[22px] md:text-[28px] leading-tight font-bold mb-3">{title}</h1>
        {salary && (
          <div className="text-lg md:text-xl text-gray-900 font-semibold">
            {salary}{' '}
            {(salaryDetails || salaryFrequency) && (
              <span className="text-gray-600 font-normal text-base md:text-lg">
                {salaryDetails && `${salaryDetails}.`}
                {salaryFrequency && (
                  <>
                    {' '}Выплаты: {salaryFrequency}
                  </>
                )}
              </span>
            )}
          </div>
        )}
        {(experience || workFormats.length > 0 || workScheduleTypes.length > 0 || workSchedules.length > 0 || workDayLengths.length > 0 || shiftTypes.length > 0 || employment.length > 0 || educationTypes.length > 0) && (
          <div className="mt-3 text-sm md:text-base text-gray-700 space-y-1">
            {experience && (
              <div><span>Опыт работы:</span> {experience}</div>
            )}
            {educationTypes.length > 0 && (
              <div><span>Образование:</span> {educationTypes.join(', ')}</div>
            )}     
            {employment.length > 0 && (
              <div>{employment.join(', ')}</div>
            )}                   
            {workFormats.length > 0 && (
              <div><span>Формат работы:</span> {workFormats.join(', ')}</div>
            )}
            {workSchedules.length > 0 && (
              <div><span>График:</span> {workSchedules.join(', ')}</div>
            )}
            {workDayLengths.length > 0 && (
              <div><span>Часов в день:</span> {workDayLengths.join(', ')}</div>
            )}
            {shiftTypes.length > 0 && (
              <div><span>Смены:</span> {shiftTypes.join(', ')}</div>
            )}


          </div>
        )}
        {addressLine && (
          <div className="mt-3 text-gray-600 text-sm flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500" aria-hidden="true">
              <path d="M12 2.25c-4.28 0-7.75 3.47-7.75 7.75 0 5.81 7.13 11.22 7.43 11.45.2.15.47.15.67 0 .3-.23 7.43-5.64 7.43-11.45 0-4.28-3.47-7.75-7.75-7.75Zm0 10.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
            </svg>
            <span>{addressLine}</span>
          </div>
        )}

        {/* Информация о компании */}
        {(companyName || logoUrl) && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4">
            {logoUrl && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={buildCompanyLogoSrc(logoUrl)} alt={companyName} className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <div className="text-gray-800">
              <div className="font-semibold">{companyName}</div>
            </div>
          </div>
        )}

        {/* Обязанности / описание */}
        {job.description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div
              className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
        )}

        {/* Панель действий (sticky внутри карточки) */}
        <div className="sticky bottom-0 -mx-6 md:-mx-8 mt-4 border-t bg-white/90 backdrop-blur">
          <div className="px-6 md:px-8 py-3 flex flex-wrap items-center gap-3">
            <VacancyDetailClient 
              jobId={idNum}
              jobTitle={title}
              isPromo={isPromo}
              promoRedirectPath={promoRedirectPath}
              noResumeApply={job.no_resume_apply}
            />
            <button type="button" aria-label="Добавить в избранное" className="bg-gray-100 text-gray-800 p-2 rounded-md border border-gray-300 hover:bg-gray-200 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                <path d="M11.645 20.91l-.007-.003-.022-.01a15.247 15.247 0 01-.383-.18 25.18 25.18 0 01-4.244-2.63C4.688 16.227 2.25 13.157 2.25 9.75 2.25 7.093 4.343 5 7 5c1.6 0 3.09.744 4.095 1.993A5.376 5.376 0 0115.19 5C17.846 5 19.94 7.093 19.94 9.75c0 3.407-2.438 6.477-4.74 8.337a25.175 25.175 0 01-4.244 2.63 15.247 15.247 0 01-.383.18l-.022.01-.007.003a.75.75 0 01-.6 0z" />
              </svg>
            </button>
            <details className="relative">
              <summary aria-label="Дополнительные действия" className="list-none cursor-pointer select-none bg-gray-100 text-gray-800 p-2 rounded-md border border-gray-300 hover:bg-gray-200 transition flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path d="M6 12a2 2 0 114 0 2 2 0 01-4 0zm4 0a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" />
                </svg>
              </summary>
              <div className="absolute bottom-12 left-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">В черный список</button>
                <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Пожаловаться</button>
              </div>
            </details>
          </div>
        </div>

      </div>

        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const idNum = Number(params.id)
  if (!Number.isFinite(idNum)) {
    return { title: 'Вакансия | E77.top' }
  }
  try {
    const h = headers()
    const proto = h.get('x-forwarded-proto') || 'http'
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000'
    const absUrl = new URL(API_ENDPOINTS.jobById(idNum), `${proto}://${host}`)
    const res = await fetch(absUrl.toString(), { cache: 'no-store' })
    if (!res.ok) return { title: 'Вакансия | E77.top' }
    const job: JobPosting = await res.json()
    const title = buildVacancyMetaTitle(job)
    const description = buildVacancyMetaDescription(job)
    const keywords = buildVacancyKeywords(job)
    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
      },
      twitter: {
        title,
        description,
      },
    }
  } catch {
    return { title: 'Вакансия | E77.top' }
  }
}
