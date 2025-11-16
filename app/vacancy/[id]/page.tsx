/**
 * @file: app/vacancy/[id]/page.tsx
 * @description: Страница детального просмотра вакансии с SSR, хлебными крошками и кнопкой-заглушкой «Откликнуться»
 * @dependencies: app/config/api.ts (API_ENDPOINTS.jobById)
 * @created: 2025-11-10
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { API_ENDPOINTS } from '../../config/api'

interface City { name?: string }
interface CompanyProfile { company_name?: string; logo_url?: string }
interface CompanyAddress { address?: string; city?: City | null }
interface NamedId { name?: string; [key: string]: any }
interface JobPosting {
  job_id: number
  title: string
  description?: string
  company_profile?: CompanyProfile | null
  company_address?: CompanyAddress | null
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  salary_type?: string
  work_experience?: string
  work_formats?: NamedId[]
  employment_types?: NamedId[]
  work_schedules?: NamedId[]
  day_lengths?: NamedId[]
  shift_types?: NamedId[]
}

const salaryPeriodMap: Record<string, string> = {
  month: 'за месяц',
  hour: 'в час',
  shift: 'смена',
  vahta: 'вахта',
  project: 'проект',
}
const salaryTypeMap: Record<string, string> = {
  after_tax: 'на руки',
  before_tax: 'до вычета налогов',
}
const workExperienceMap: Record<string, string> = {
  '0': 'без опыта',
  '0_1': 'до 1 года',
  '1_3': 'от 1 до 3 лет',
  '3_5': 'от 3 до 6 лет',
  'more_5': 'более 6 лет',
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
  const currency = cur === 'RUB' ? '₽' : (cur || '')
  return [range, currency].filter(Boolean).join(' ')
}
function getSalaryDetails(job: JobPosting) {
  const period = job.salary_period ? salaryPeriodMap[job.salary_period] : undefined
  const stype = job.salary_type ? salaryTypeMap[job.salary_type] : undefined
  return [period, stype].filter(Boolean).join(', ')
}

function chipsFrom(names?: NamedId[]) {
  return (names || []).map(n => n?.name).filter(Boolean) as string[]
}

export default async function VacancyPage({ params }: { params: { id: string } }) {
  const idNum = Number(params.id)
  if (!Number.isFinite(idNum)) {
    notFound()
  }

  const res = await fetch(API_ENDPOINTS.jobById(idNum), { cache: 'no-store' })
  if (res.status === 404) {
    notFound()
  }
  if (!res.ok) {
    throw new Error('Failed to load job')
  }
  const job: JobPosting = await res.json()

  const title = job.title
  const salary = formatSalary(job)
  const salaryDetails = getSalaryDetails(job)
  const companyName = job.company_profile?.company_name || ''
  const logoUrl = job.company_profile?.logo_url
  const city = job.company_address?.city?.name || ''
  const addr = job.company_address?.address || ''
  const addressLine = [city, addr].filter(Boolean).join(', ')
  const experience = job.work_experience ? workExperienceMap[job.work_experience] : undefined
  const workFormats = chipsFrom(job.work_formats)
  const employment = chipsFrom(job.employment_types)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-10 pt-20">
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
            {salary} {salaryDetails && <span className="text-gray-600 font-normal">({salaryDetails})</span>}
          </div>
        )}
        {(companyName || experience || workFormats.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] md:text-sm">
            {companyName && <span className="text-gray-700">{companyName}</span>}
            {experience && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{experience}</span>
            )}
            {workFormats.map((w) => (
              <span key={w} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">{w}</span>
            ))}
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
                <img src={logoUrl} alt={companyName} className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <div className="text-gray-800">
              <div className="font-semibold">{companyName}</div>
              {city && <div className="text-sm text-gray-600">{city}</div>}
            </div>
          </div>
        )}

        {/* Ключевые параметры */}
        {(employment.length > 0) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-gray-900 font-semibold mb-3">Условия</div>
            <div className="flex flex-wrap gap-2 text-[13px] md:text-sm">
              {employment.map((e) => (
                <span key={e} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">{e}</span>
              ))}
            </div>
          </div>
        )}

        {/* Обязанности / описание */}
        {job.description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-gray-900 font-semibold mb-3">Обязанности</div>
            <div className="prose prose-sm max-w-none">
              {job.description.split(/\n+/).map((p, i) => (
                <p key={i} className="text-gray-800 leading-relaxed">{p}</p>
              ))}
            </div>
          </div>
        )}

        {/* Панель действий (sticky внутри карточки) */}
        <div className="sticky bottom-0 -mx-6 md:-mx-8 border-t bg-white/90 backdrop-blur">
          <div className="px-6 md:px-8 py-3 flex flex-wrap items-center gap-3">
            <button type="button" className="bg-[#2B81B0] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18608a] transition">
              Откликнуться
            </button>
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
    return { title: 'Вакансия | JobFind' }
  }
  try {
    const res = await fetch(API_ENDPOINTS.jobById(idNum), { cache: 'no-store' })
    if (!res.ok) return { title: 'Вакансия | JobFind' }
    const job: JobPosting = await res.json()
    const city = job.company_address?.city?.name
    const title = `${job.title}${city ? ' — ' + city : ''} | Вакансия`
    const descBase = job.description?.replace(/\s+/g, ' ').slice(0, 160) || undefined
    return {
      title,
      description: descBase,
      openGraph: {
        title,
        description: descBase,
      },
      twitter: {
        title,
        description: descBase,
      },
    }
  } catch {
    return { title: 'Вакансия | JobFind' }
  }
}
