/**
 * @file: SlugVacancyClient.tsx
 * @description: Клиентская страница списка вакансий по городу (city_slug) с оформлением карточек как на /vacancy.
 * @dependencies: app/config/api, app/config/work_formats_202505222228.json
 * @created: 2025-11-18
 */
'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import workFormatsConfig from '../../config/work_formats_202505222228.json'

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

const salaryPeriodOptions = [
  { label: 'за месяц', value: 'month' },
  { label: 'в час', value: 'hour' },
  { label: 'смена', value: 'shift' },
  { label: 'вахта', value: 'vahta' },
  { label: 'проект', value: 'project' },
]
const salaryTypeOptions = [
  { label: 'на руки', value: 'after_tax' },
  { label: 'до вычета налогов', value: 'before_tax' },
]
const workExperienceOptions = [
  { label: 'без опыта', value: '0' },
  { label: 'до 1 года', value: '0_1' },
  { label: 'от 1 до 3 лет', value: '1_3' },
  { label: 'от 3 до 6 лет', value: '3_5' },
  { label: 'более 6 лет', value: 'more_5' },
]
const workFormatsMap: Record<number, string> = (workFormatsConfig as any)?.work_formats?.reduce((acc: Record<number, string>, wf: any) => {
  if (wf && typeof wf.work_format_id === 'number' && typeof wf.name === 'string') {
    acc[wf.work_format_id] = wf.name
  }
  return acc
}, {}) || {}

const formatSalary = (job: JobListItem) => {
  const min = job.salary_min
  const max = job.salary_max
  if (min && max) return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')}`
  if (min) return `от ${min.toLocaleString('ru-RU')}`
  if (max) return `до ${max.toLocaleString('ru-RU')}`
  return ''
}
const getSalaryDetails = (job: JobListItem) => {
  const period = salaryPeriodOptions.find(p => p.value === job.salary_period)?.label
  const sType = salaryTypeOptions.find(t => t.value === job.salary_type)?.label
  return [period, sType].filter(Boolean).join(', ')
}
const getExperienceLabel = (value?: string) => workExperienceOptions.find(o => o.value === value)?.label
const getWorkFormatLabels = (ids?: number[]) => (ids || []).map(id => workFormatsMap[id]).filter(Boolean)

export default function SlugVacancyClient() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('city_slug', String(slug))
        // Опционально пробрасываем поддерживаемые доп.параметры, если появятся в будущем
        const companyId = searchParams.get('company_id')
        if (companyId) params.set('company_id', companyId)
        const professionSlug = searchParams.get('profession_slug')
        if (professionSlug) params.set('profession_slug', professionSlug)
        const industrySlug = searchParams.get('industry_slug')
        if (industrySlug) params.set('industry_slug', industrySlug)

        if (abortControllerRef.current) abortControllerRef.current.abort()
        abortControllerRef.current = new AbortController()

        const res = await fetch(`/api/jobs/searchBySlug?${params.toString()}`, {
          signal: abortControllerRef.current.signal
        })
        if (!res.ok) throw new Error('Failed to fetch jobs')
        const data = await res.json()
        setJobs(Array.isArray(data) ? data : [])
        setError(null)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [slug, searchParams])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
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
                  <div className="flex flex-wrap gap-2">
                    {getExperienceLabel(job.work_experience) && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{getExperienceLabel(job.work_experience)}</span>
                    )}
                    {getWorkFormatLabels(job.work_format_ids).map((name) => (
                      <span key={name} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">{name}</span>
                    ))}
                  </div>
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
  )
}
