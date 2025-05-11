'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import JobFilters from '../components/JobFilters'

interface JobPosting {
  id: number
  title: string
  company: string
  salary_min: number
  salary_max: number
  experience_level: string
  employment_type: string
  work_format: string
  work_schedule: string
  publication_city_id: number
}

export default function Vacancy() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<JobPosting[]>([])
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

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        // Формируем параметры только из searchParams
        const params = new URLSearchParams()
        searchParams.forEach((value, key) => {
          // Если параметр уже есть, добавляем как массив
          if (params.has(key)) {
            params.append(key, value)
          } else {
            params.set(key, value)
          }
        })

        // Cancel any ongoing request
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
        setJobs(data)
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

  // Склонение слова "вакансия" и "найдено"
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

  // Обработка поиска
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

  // Закрытие меню сортировки при клике вне
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

  // Закрытие меню периода при клике вне
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

  // Опции сортировки
  const sortOptions = [
    { label: 'По соответствию', sort: 'relevance', sort_direction: 'desc' },
    { label: 'По убыванию даты размещения', sort: 'date', sort_direction: 'desc' },
    { label: 'По возрастанию даты размещения', sort: 'date', sort_direction: 'asc' },
    { label: 'По убыванию зарплаты', sort: 'salary', sort_direction: 'desc' },
    { label: 'По возрастанию зарплаты', sort: 'salary', sort_direction: 'asc' },
  ];
  // Текущий выбранный вариант
  const currentSort = sortOptions.find(
    o => o.sort === (searchParams.get('sort') || 'relevance') && (searchParams.get('sort_direction') || 'desc') === o.sort_direction
  ) || sortOptions[0];

  // Обработка выбора сортировки
  const handleSortSelect = (option: typeof sortOptions[0]) => {
    setSortMenuOpen(false);
    setSort(option.sort);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('sort', option.sort);
    params.set('sort_direction', option.sort_direction);
    window.location.search = params.toString();
  };

  // Опции периода
  const periodOptions = [
    { label: 'За всё время', value: 'all' },
    { label: 'За месяц', value: 'month' },
    { label: 'За неделю', value: 'week' },
    { label: 'За сутки', value: 'day' },
  ];
  const currentPeriod = periodOptions.find(o => (searchParams.get('date_range') || 'all') === o.value) || periodOptions[0];

  // Обработка выбора периода
  const handlePeriodSelect = (option: typeof periodOptions[0]) => {
    setPeriodMenuOpen(false);
    setPeriod(option.value);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('date_range', option.value);
    window.location.search = params.toString();
  };

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
      <div className="flex gap-8">
        <JobFilters />
        <div className="flex-1">
          {/* Поисковая панель и сортировка */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col gap-2 sticky top-0 z-20">
            {/* Первая строка: поиск и кнопки */}
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
            {/* Вторая строка: счетчик, сортировка, фильтр по времени */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 md:mt-0">
              <div className="text-gray-700 font-medium">
                {pluralizeFound(jobs.length)} <span className="font-bold">{jobs.length}</span> {pluralizeVacancy(jobs.length)}
              </div>
              {/* Сортировка */}
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
              {/* Фильтр по времени */}
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
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                  <p className="text-gray-600 mb-2">{job.company}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {job.experience_level}
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {job.employment_type}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {job.work_format}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800">
                    {job.salary_min} - {job.salary_max} ₽
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