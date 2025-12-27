/**
 * @file: VacancyClient.tsx
 * @description: Клиентская страница списка вакансий с фильтрами и использованием useSearchParams.
 * @dependencies: app/config/api, app/components/JobFilters, work_formats json
 * @created: 2025-11-16
 */
'use client'
import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { API_ENDPOINTS } from '../config/api'
import workFormatsConfig from '../config/work_formats_202505222228.json'
import { useSearchParams } from 'next/navigation'
import JobFilters from '../components/JobFilters'
import Pagination from '../components/Pagination'
import { useUser } from '../components/useUser'
import ApplicationModal from '../components/ApplicationModal'
  const salaryPeriodOptions = [
    { label: 'в месяц', value: 'month' },
    { label: 'в час', value: 'hour' },
    { label: 'за смену', value: 'shift' },
    { label: 'за вахту', value: 'vahta' },
    { label: 'за проект', value: 'project' },
  ]
  const salaryTypeOptions = [
    { label: 'на руки', value: 'after_tax' },
    { label: 'до вычета налогов', value: 'before_tax' },
  ]
  const workExperienceOptions = [
    { label: 'Без опыта', value: '0' },
    { label: 'Опыт до 1 года', value: '0_1' },
    { label: 'Опыт 1-3 года', value: '1_3' },
    { label: 'Опыт 3-5 лет', value: '3_5' },
    { label: 'Опыт от 5 лет', value: 'more_5' },
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
  no_resume_apply?: boolean
}

interface PaginatedJobsResponse {
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

export default function VacancyClient() {
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page') || '1') || 1
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [selectedCityNames, setSelectedCityNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const query = searchParams.get('query') || '';
  const [searchValue, setSearchValue] = useState(query);
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');
  const [period, setPeriod] = useState(searchParams.get('period') || 'all');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef<HTMLDivElement>(null);
  const { role } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null)

  // Скролл к началу списка при смене страницы
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()

        // Копируем все текущие параметры поиска
        searchParams.forEach((value, key) => {
          if (params.has(key)) {
            params.append(key, value)
          } else {
            params.set(key, value)
          }
        })

        // Гарантируем лимит 50 вакансий на страницу
        params.set('limit', '50')

        // Если page не задан, считаем, что это первая страница
        const currentPageFromQuery = searchParams.get('page')
        if (!currentPageFromQuery) {
          params.delete('page')
        }

        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          signal: abortControllerRef.current.signal
        })
        if (!response.ok) {
          throw new Error('Failed to fetch jobs')
        }
        const data = await response.json()

        if (Array.isArray(data)) {
          // Без явной пагинации: работаем с массивом как с одной страницей
          setJobs(data)
          setTotal(data.length)
          setTotalPages(1)
        } else {
          const paginated = data as PaginatedJobsResponse
          const pageJobs = paginated.data || []
          setJobs(pageJobs)
          setTotal(typeof paginated.total === 'number' ? paginated.total : pageJobs.length)
          setTotalPages(paginated.total_pages || 1)
        }
        setError(null)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [searchParams])

  useEffect(() => {
    const cityIdsParam = searchParams.get('city_id')
    if (!cityIdsParam) {
      setSelectedCityNames([])
      return
    }
    const ids = cityIdsParam.split(',').map(Number).filter(Boolean)
    if (ids.length === 0) {
      setSelectedCityNames([])
      return
    }
    let aborted = false
    const loadCities = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.dictionaries.citiesByIds, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city_ids: ids })
        })
        if (!res.ok) {
          setSelectedCityNames([])
          return
        }
        const data = await res.json()
        if (!aborted) {
          const names = Array.isArray(data) ? data.map((c: any) => c.name).filter(Boolean) : []
          setSelectedCityNames(names)
        }
      } catch {
        if (!aborted) setSelectedCityNames([])
      }
    }
    loadCities()
    return () => { aborted = true }
  }, [searchParams])

  function pluralizeVacancy(n: number) {
    if (n % 10 === 1 && n % 100 !== 11) return 'вакансия';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'вакансии';
    return 'вакансий';
  }
  function pluralizeFound(n: number) {
    if (n % 10 === 1 && n % 100 !== 11) return 'Найдена';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'Найдены';
    return 'Найдено';
  }

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchValue) {
      params.set('query', searchValue);
    } else {
      params.delete('query');
    }
    window.location.search = params.toString();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }
    if (sortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target as Node)) {
        setPeriodMenuOpen(false);
      }
    }
    if (periodMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [periodMenuOpen]);

  const sortOptions = [
    { label: 'По соответствию', sort: 'relevance', sort_direction: 'desc' },
    { label: 'По убыванию даты размещения', sort: 'date', sort_direction: 'desc' },
    { label: 'По возрастанию даты размещения', sort: 'date', sort_direction: 'asc' },
    { label: 'По убыванию зарплаты', sort: 'salary', sort_direction: 'desc' },
    { label: 'По возрастанию зарплаты', sort: 'salary', sort_direction: 'asc' },
  ];
  const currentSort = sortOptions.find(
    o => o.sort === (searchParams.get('sort') || 'relevance') && (searchParams.get('sort_direction') || 'desc') === o.sort_direction
  ) || sortOptions[0];

  const handleSortSelect = (option: typeof sortOptions[0]) => {
    setSortMenuOpen(false);
    setSort(option.sort);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('sort', option.sort);
    params.set('sort_direction', option.sort_direction);
    window.location.search = params.toString();
  };

  const periodOptions = [
    { label: 'За всё время', value: 'all' },
    { label: 'За месяц', value: 'month' },
    { label: 'За неделю', value: 'week' },
    { label: 'За сутки', value: 'day' },
  ];
  const currentPeriod = periodOptions.find(o => (searchParams.get('date_range') || 'all') === o.value) || periodOptions[0];

  const handlePeriodSelect = (option: typeof periodOptions[0]) => {
    setPeriodMenuOpen(false);
    setPeriod(option.value);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('date_range', option.value);
    window.location.search = params.toString();
  };

  const getPrimaryAddress = (job: JobListItem) => {
    if (Array.isArray(job.addresses) && job.addresses.length > 0) {
      return job.addresses[0]
    }
    return job.address || undefined
  }

  const resolveCity = (job: JobListItem) => {
    const primary = getPrimaryAddress(job)
    if (primary && primary.city) return primary.city
    const cities = job.publication_cities || []
    if (cities.length === 0) return ''
    const match = selectedCityNames.find(n => cities.includes(n))
    if (match) return match
    return cities[0]
  }

  const handleApplyClick = (job: JobListItem) => {
    if (role === 'job_seeker') {
      setSelectedJob(job)
      setIsModalOpen(true)
    } else if (role === 'guest') {
      window.location.href = '/login?redirect=' + encodeURIComponent(`/vacancy/${job.job_id}`)
    }
  }

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
    <div className="max-w-6xl mx-auto px-4 py-8 pt-16">
      <div className="flex gap-8">
        <JobFilters />
        <div className="flex-1">
          <div className="bg-white rounded-lg p-4 mb-6 flex flex-col gap-2 sticky top-0 z-20">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Должность, профессия или ключевые слова"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-[#2B81B0] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18608a] transition">Найти</button>
                <button type="button" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md font-semibold border border-gray-300 hover:bg-gray-200 transition flex items-center gap-2">Сохранить поиск <svg xmlns='http://www.w3.org/2000/svg' className='inline-block' width='18' height='18' viewBox='0 0 20 20' fill='red'><path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z'/></svg></button>
              </div>
            </form>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 md:mt-0">
              <div className="text-gray-700 font-medium">
                {pluralizeFound(total)} <span className="font-bold">{total}</span> {pluralizeVacancy(total)}
              </div>
              {total > 0 && (
                <div className="text-gray-500 text-sm">
                  {(() => {
                    const pageSize = 50
                    const from = (currentPage - 1) * pageSize + 1
                    const to = Math.min(currentPage * pageSize, total)
                    return `Показаны ${from}–${to} из ${total}`
                  })()}
                </div>
              )}
              <div className="relative" ref={sortMenuRef}>
                <span className="text-gray-700 mr-1">Сортировать:</span>
                <button
                  type="button"
                  className="font-medium text-[#2B81B0] hover:underline focus:outline-none"
                  onClick={() => setSortMenuOpen(open => !open)}
                >
                  {currentSort.label} <span className="inline-block align-middle">&#709;</span>
                </button>
                {sortMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-4 px-6 flex flex-col gap-2 animate-fade-in">
                    {sortOptions.map(option => (
                      <button
                        key={option.label}
                        className={`text-left px-2 py-2 rounded-lg hover:bg-gray-50${currentSort.label === option.label ? ' font-semibold text-[#2B81B0]' : ' text-gray-900'} hover:text-[#2B81B0]`}
                        onClick={() => handleSortSelect(option)}
                      >
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={periodMenuRef}>
                <span className="text-gray-700 mr-1">Показывать:</span>
                <button
                  type="button"
                  className="font-medium text-[#2B81B0] hover:underline focus:outline-none"
                  onClick={() => setPeriodMenuOpen(open => !open)}
                >
                  {currentPeriod.label} <span className="inline-block align-middle">&#709;</span>
                </button>
                {periodMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-4 px-6 flex flex-col gap-2 animate-fade-in">
                    {periodOptions.map(option => (
                      <button
                        key={option.value}
                        className={`text-left px-2 py-2 rounded-lg hover:bg-gray-50${currentPeriod.value === option.value ? ' font-semibold text-[#2B81B0]' : ' text-gray-900'} hover:text-[#2B81B0]`}
                        onClick={() => handlePeriodSelect(option)}
                      >
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center text-gray-500">
              По вашему запросу вакансий не найдено
            </div>
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
                        <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm max-w-max">{getExperienceLabel(job.work_experience)}</span>
                      )}
                      {getWorkFormatLabels(job.work_format_ids).map((name) => (
                        <span key={name} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">{name}</span>
                      ))}
                    </div>

                    <div className="text-gray-700 mt-1">{job.company_name}</div>

                    {(() => {
                      const primary = getPrimaryAddress(job)
                      const city = primary?.city || resolveCity(job)
                      const addr = primary?.address
                      const line = [city, addr].filter(Boolean).join(', ')
                      return line ? (
                        <div className="mt-1 text-gray-600 text-sm flex items-center gap-1">
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

                    <button 
                      type="button" 
                      onClick={() => handleApplyClick(job)}
                      className="mt-3 inline-flex justify-center bg-[#2B81B0] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18608a] transition w-auto self-start"
                    >
                      Откликнуться
                    </button>
                  </div>
                  <div className="flex items-start gap-4 md:ml-4">
                    {job.logo_url && (
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                        <img src={buildCompanyLogoSrc(job.logo_url)} alt={job.company_name} className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} />
            </>
          )}
        </div>
      </div>
      {selectedJob && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedJob(null)
          }}
          jobId={selectedJob.job_id}
          jobTitle={selectedJob.title}
          noResumeApply={selectedJob.no_resume_apply}
        />
      )}
    </div>
  )
}
