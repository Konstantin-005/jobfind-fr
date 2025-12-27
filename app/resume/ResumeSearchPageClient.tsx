'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '../components/useUser';
import ResumeCard from '../components/ResumeCard';
import { Resume, SearchResumesResponse } from '../types/resume';
import { apiRequest } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import Link from 'next/link';
import ResumeFiltersModal, { ResumeFilters } from '../components/ResumeFiltersModal';

export default function ResumeSearchPageClient() {
  const { role, isLoading: isAuthLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [keyword, setKeyword] = useState('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState('updated_at_desc');
  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Partial<ResumeFilters>>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const countActiveFilters = (f: Partial<ResumeFilters>) => {
    let count = 0;
    if (f.region_ids?.length) count++;
    if (f.city_ids?.length) count++;
    if (f.job_search_status?.length) count++;
    if (f.age_min || f.age_max) count++;
    if (f.has_photo) count++;
    if (f.employment_type_ids?.length) count++;
    if (f.work_format_ids?.length) count++;
    if (f.total_experience_level?.length) count++;
    if (f.profession_ids?.length) count++;
    if (f.gender) count++;
    if (f.salary_min || f.salary_max) count++;
    if (f.education_type_ids?.length) count++;
    if (f.skill_ids?.length) count++;
    if (f.driving_license_category_ids?.length) count++;
    if (f.languages?.length) count++;
    return count;
  };

  const buildSearchParams = (
    currentKeyword: string,
    currentPage: number,
    currentLimit: number,
    currentSortBy: string,
    currentFilters: Partial<ResumeFilters>
  ) => {
    const params = new URLSearchParams();
    if (currentKeyword) params.append('keyword', currentKeyword);
    params.append('page', currentPage.toString());
    params.append('limit', currentLimit.toString());
    params.append('sort_by', currentSortBy);

    const appendArray = (key: string, values?: any[]) => {
      if (values && values.length > 0) {
        values.forEach(val => params.append(`${key}[]`, val.toString()));
      }
    };

    if (currentFilters.salary_min) params.append('salary_min', currentFilters.salary_min.toString());
    if (currentFilters.salary_max) params.append('salary_max', currentFilters.salary_max.toString());
    if (currentFilters.age_min) params.append('age_min', currentFilters.age_min.toString());
    if (currentFilters.age_max) params.append('age_max', currentFilters.age_max.toString());
    if (currentFilters.gender) params.append('gender', currentFilters.gender);
    if (currentFilters.has_photo !== undefined) params.append('has_photo', currentFilters.has_photo.toString());

    appendArray('profession_ids', currentFilters.profession_ids);
    appendArray('employment_type_ids', currentFilters.employment_type_ids);
    appendArray('work_format_ids', currentFilters.work_format_ids);
    appendArray('skill_ids', currentFilters.skill_ids);
    appendArray('education_type_ids', currentFilters.education_type_ids);
    appendArray('city_ids', currentFilters.city_ids);
    appendArray('region_ids', currentFilters.region_ids);
    appendArray('driving_license_category_ids', currentFilters.driving_license_category_ids);
    appendArray('job_search_status', currentFilters.job_search_status);
    appendArray('total_experience_level', currentFilters.total_experience_level);

    if (currentFilters.languages && currentFilters.languages.length > 0) {
      currentFilters.languages.forEach((lang, index) => {
        params.append(`languages[${index}][language_id]`, lang.language_id.toString());
        params.append(`languages[${index}][proficiency_level]`, lang.proficiency_level);
      });
    }

    return params;
  };

  useEffect(() => {
    if (isAuthLoading || role !== 'employer') return;

    const params = new URLSearchParams(searchParams.toString());

    const urlKeyword = params.get('keyword') || '';
    const urlPage = parseInt(params.get('page') || '1');
    const urlLimit = parseInt(params.get('limit') || '25');
    const urlSortBy = params.get('sort_by') || 'updated_at_desc';

    const getNumArray = (key: string) => params.getAll(`${key}[]`).map(Number);
    const getStrArray = (key: string) => params.getAll(`${key}[]`);

    const parsedFilters: Partial<ResumeFilters> = {
      profession_ids: getNumArray('profession_ids'),
      employment_type_ids: getNumArray('employment_type_ids'),
      work_format_ids: getNumArray('work_format_ids'),
      skill_ids: getNumArray('skill_ids'),
      education_type_ids: getNumArray('education_type_ids'),
      city_ids: getNumArray('city_ids'),
      region_ids: getNumArray('region_ids'),
      driving_license_category_ids: getNumArray('driving_license_category_ids'),
      job_search_status: getStrArray('job_search_status'),
      total_experience_level: getStrArray('total_experience_level'),
      gender: params.get('gender') || undefined,
      has_photo: params.has('has_photo') ? params.get('has_photo') === 'true' : undefined,
      salary_min: params.get('salary_min') ? Number(params.get('salary_min')) : undefined,
      salary_max: params.get('salary_max') ? Number(params.get('salary_max')) : undefined,
      age_min: params.get('age_min') ? Number(params.get('age_min')) : undefined,
      age_max: params.get('age_max') ? Number(params.get('age_max')) : undefined,
    };

    const langsMap = new Map<number, any>();
    params.forEach((value, key) => {
      const match = key.match(/languages\[(\d+)\]\[(\w+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        if (!langsMap.has(index)) langsMap.set(index, {});
        const langObj = langsMap.get(index);
        if (field === 'language_id') langObj.language_id = Number(value);
        if (field === 'proficiency_level') langObj.proficiency_level = value;
      }
    });
    if (langsMap.size > 0) {
      parsedFilters.languages = Array.from(langsMap.values());
    }

    setKeyword(urlKeyword);
    setPage(urlPage);
    setLimit(urlLimit);
    setSortBy(urlSortBy);
    setFilters(parsedFilters);
    setActiveFiltersCount(countActiveFilters(parsedFilters));

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const url = `${API_ENDPOINTS.resumes.search}?${params.toString()}`;
        const response = await apiRequest<SearchResumesResponse>(url, { method: 'GET' });

        const data = response.data;
        if (data && data.data && Array.isArray(data.data)) {
          setResumes(data.data);
          setTotalCount(data.total || 0);
        } else {
          setResumes([]);
        }
      } catch (error) {
        console.error('Failed to fetch resumes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams, role, isAuthLoading]);

  const handleSearch = () => {
    const params = buildSearchParams(keyword, 1, limit, sortBy, filters);
    router.push(`/resume?${params.toString()}`, { scroll: false });
  };

  const handleApplyFilters = (newFilters: ResumeFilters) => {
    const params = buildSearchParams(keyword, 1, limit, sortBy, newFilters);
    router.push(`/resume?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    const params = buildSearchParams(keyword, newPage, limit, sortBy, filters);
    router.push(`/resume?${params.toString()}`, { scroll: false });
  };

  const handleLimitChange = (newLimit: number) => {
    const params = buildSearchParams(keyword, 1, newLimit, sortBy, filters);
    router.push(`/resume?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (newSortBy: string) => {
    const params = buildSearchParams(keyword, 1, limit, newSortBy, filters);
    router.push(`/resume?${params.toString()}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (role !== 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">J</span>
            </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Доступ только для работодателей
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Поиск по базе резюме доступен только зарегистрированным работодателям.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <p className="mb-8 text-gray-700">
              Находите лучших специалистов для вашей компании. Просматривайте тысячи резюме, используйте удобные фильтры и связывайтесь с кандидатами напрямую.
            </p>

            <div className="space-y-4">
              <Link
                href="/register/employer"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Зарегистрироваться как работодатель
              </Link>

              <div className="text-sm">
                <span className="text-gray-500">Уже есть аккаунт? </span>
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Войти
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Tabs */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium">
            Поиск по базе
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors">
            Избранное
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors">
            Автопоиск
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm shadow-sm"
              placeholder="Поиск по резюме и навыкам"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button
            onClick={() => setIsFiltersOpen(true)}
            className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors gap-2 ${activeFiltersCount > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Фильтры
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>

          <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          <button
            onClick={handleSearch}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            Найти
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['Регион', 'Статус поиска', 'Тип занятости', 'График работы', 'Общий опыт', 'Уровень дохода'].map((filter) => (
            <button
              key={filter}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <span className="text-gray-400 font-normal">+</span> {filter}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {isLoading ? 'Загрузка...' : `${totalCount.toLocaleString('ru-RU')} резюме`}
          </h2>

          <div className="flex items-center gap-4">
            {/* Sort Selector */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="min-w-[200px] flex items-center justify-between gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium text-sm rounded-xl py-2 pl-4 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors shadow-sm"
              >
                <span>
                  {sortBy === 'updated_at_desc' && 'По дате обновления'}
                  {sortBy === 'salary_desc' && 'По убыванию зарплаты'}
                  {sortBy === 'salary_asc' && 'По возрастанию зарплаты'}
                  {sortBy === 'relevance' && 'По соответствию'}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                    {[
                      { value: 'updated_at_desc', label: 'По дате обновления' },
                      { value: 'salary_desc', label: 'По убыванию зарплаты' },
                      { value: 'salary_asc', label: 'По возрастанию зарплаты' },
                      { value: 'relevance', label: 'По соответствию' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          handleSortChange(opt.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                          sortBy === opt.value
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Limit Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLimitOpen(!isLimitOpen)}
                className="min-w-[160px] flex items-center justify-between gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium text-sm rounded-xl py-2 pl-4 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors shadow-sm"
              >
                <span>{limit} резюме</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isLimitOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isLimitOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLimitOpen(false)} />
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                    {[25, 50, 100].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          handleLimitChange(opt);
                          setIsLimitOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                          limit === opt ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {opt} резюме
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resume List */}
        <div className="space-y-4">
          {isLoading && resumes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Загрузка резюме...</div>
          ) : resumes.length > 0 ? (
            resumes.map((resume) => <ResumeCard key={resume.link_uuid} resume={resume} />)
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Резюме не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCount > limit && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-1 bg-white px-2 py-2 rounded-2xl shadow-sm border border-gray-100">
              {/* Prev Button */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {(() => {
                const totalPages = Math.ceil(totalCount / limit);
                const pageNumbers: (number | string)[] = [];

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
                } else {
                  if (page <= 4) {
                    for (let i = 1; i <= 6; i++) pageNumbers.push(i);
                    pageNumbers.push('...');
                    pageNumbers.push(totalPages);
                  } else if (page >= totalPages - 3) {
                    pageNumbers.push(1);
                    pageNumbers.push('...');
                    for (let i = totalPages - 5; i <= totalPages; i++) pageNumbers.push(i);
                  } else {
                    pageNumbers.push(1);
                    pageNumbers.push('...');
                    for (let i = page - 1; i <= page + 1; i++) pageNumbers.push(i);
                    pageNumbers.push('...');
                    pageNumbers.push(totalPages);
                  }
                }

                return pageNumbers.map((p, idx) =>
                  typeof p === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        page === p ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-400">
                      ...
                    </span>
                  ),
                );
              })()}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page * limit >= totalCount}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters Modal */}
      <ResumeFiltersModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}
