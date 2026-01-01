/**
 * @file: app/employer/vacancies/EmployerVacanciesPageClient.tsx
 * @description: Клиентский компонент страницы работодателя со списком вакансий и CRUD.
 * @dependencies: app/utils/api.ts (jobsApi), app/config/api.ts
 * @created: 2025-12-19
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jobsApi, type JobPosting } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';
import employmentTypesData from '../../config/employment_types_202505222228.json';
import educationTypesData from '../../config/education_types_202505242225.json';
import workFormatsData from '../../config/work_formats_202505222228.json';
import workScheduleTypesData from '../../config/work_schedule_types_20251028.json';
import workSchedulesData from '../../config/work_schedules_20251028.json';
import workDayLengthsData from '../../config/work_day_lengths_20251028.json';
import shiftTypesData from '../../config/shift_types_20251028.json';

export default function EmployerVacanciesPageClient() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isCompanyMissing, setIsCompanyMissing] = useState(false);
  const [items, setItems] = useState<JobPosting[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [showActive, setShowActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vacancyToDelete, setVacancyToDelete] = useState<JobPosting | null>(null);
  const [applicationCounts, setApplicationCounts] = useState<Record<number, number>>({});
  type CompanyAddress = { address_id: number; address: string; city?: { name?: string } };
  const [companyAddresses, setCompanyAddresses] = useState<CompanyAddress[]>([]);
  void companyAddresses;
  void employmentTypesData;
  void educationTypesData;
  void workFormatsData;
  void workScheduleTypesData;
  void workSchedulesData;
  void workDayLengthsData;
  void shiftTypesData;

  // Клиентская проверка роли работодателя
  useEffect(() => {
    try {
      const userType = typeof window !== 'undefined' ? localStorage.getItem('user_type') : null;
      if (userType !== 'employer') {
        router.replace('/login');
        return;
      }
    } finally {
      setAuthChecked(true);
    }
  }, [router]);

  const filtered = useMemo(() => {
    const base: JobPosting[] = Array.isArray(items) ? items : [];
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((v) => (v.title || '').toLowerCase().includes(q));
  }, [items, query]);

  async function loadApplicationCounts(jobIds: number[]) {
    const token = localStorage.getItem('token');
    const counts: Record<number, number> = {};

    await Promise.all(
      jobIds.map(async (jobId) => {
        try {
          const res = await fetch(API_ENDPOINTS.applications.counts(jobId), {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (res.ok) {
            const data = await res.json();
            counts[jobId] = data?.total_count ?? 0;
          }
        } catch {
          counts[jobId] = 0;
        }
      })
    );

    setApplicationCounts(counts);
  }

  async function load(nextPage = page, nextPageSize = pageSize, nextShowActive = showActive) {
    setLoading(true);
    setError(null);
    try {
      const res = await jobsApi.listCompanyJobs({
        page: nextPage,
        page_size: nextPageSize,
        is_active: nextShowActive ? true : false,
      });

      if (res.status === 401) {
        router.replace('/login');
        return;
      }

      if (res.status === 403) {
        setError(res.error || 'Только работодатели могут просматривать вакансии компании.');
        return;
      }

      if (res.status === 404) {
        if (res.error && res.error.includes('Company profile not found')) {
          setIsCompanyMissing(true);
          setItems([]);
          setTotal(0);
          return;
        }
      }

      if (res.status === 400) {
        setError(res.error || 'Некорректные параметры запроса к списку вакансий компании.');
        return;
      }

      if (res.error) {
        setError(res.error);
      }

      const payload: any = res.data ?? {};
      const rows: JobPosting[] = Array.isArray(payload) ? payload : payload?.data || [];
      setItems(Array.isArray(rows) ? rows : []);
      if (!Array.isArray(payload)) {
        setPage(payload?.page ?? nextPage);
        setPageSize(payload?.page_size ?? nextPageSize);
        setTotal(payload?.total ?? rows.length);
      } else {
        setTotal(rows.length);
      }

      // Загрузка количества откликов для каждой вакансии
      const jobIds = rows.filter((r) => r.job_id).map((r) => r.job_id!);
      if (jobIds.length > 0) {
        await loadApplicationCounts(jobIds);
      }
    } catch {
      setError('Не удалось загрузить вакансии компании. Попробуйте обновить страницу позже.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.companies.profile, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.status === 404) {
          setIsCompanyMissing(true);
          setCompanyAddresses([]);
          setItems([]);
          return;
        }

        if (res.ok) {
          setIsCompanyMissing(false);
          const data = await res.json();
          const addrs: CompanyAddress[] = Array.isArray(data?.addresses) ? data.addresses : [];
          setCompanyAddresses(addrs);
        }
      } catch {}

      await load();
    })();
  }, []);

  function handleChangeTab(nextShowActive: boolean) {
    if (showActive === nextShowActive) return;
    const firstPage = 1;
    setShowActive(nextShowActive);
    setPage(firstPage);
    void load(firstPage, pageSize, nextShowActive);
  }

  function handlePrevPage() {
    if (page <= 1) return;
    setPage((prev) => {
      const nextPage = Math.max(1, prev - 1);
      void load(nextPage, pageSize, showActive);
      return nextPage;
    });
  }

  function handleNextPage() {
    const maxPage = total > 0 ? Math.ceil(total / pageSize) : 1;
    if (page >= maxPage) return;
    setPage((prev) => {
      const nextPage = Math.min(maxPage, prev + 1);
      void load(nextPage, pageSize, showActive);
      return nextPage;
    });
  }

  function goToCreate() {
    if (isCompanyMissing) return;
    router.push('/employer/vacancies/add');
  }

  function goToEdit(jobId?: number) {
    if (isCompanyMissing) return;
    if (!jobId) return;
    router.push(`/employer/vacancies/${jobId}/edit`);
  }

  function handleDeleteClick(v: JobPosting) {
    if (isCompanyMissing) {
      return;
    }
    setVacancyToDelete(v);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!vacancyToDelete?.job_id) return;
    setLoading(true);
    setError(null);
    const isArchiving = vacancyToDelete.is_active !== false;
    const res = isArchiving ? await jobsApi.archive(vacancyToDelete.job_id) : await jobsApi.restore(vacancyToDelete.job_id);

    if (res.status === 401) {
      setDeleteModalOpen(false);
      setVacancyToDelete(null);
      router.replace('/login');
      return;
    }

    if (res.status === 403) {
      setError(res.error || 'У вас нет прав на изменение этой вакансии.');
    } else if (res.status === 404) {
      if (res.error && res.error.includes('Company profile not found')) {
        setIsCompanyMissing(true);
        setItems([]);
        setTotal(0);
      } else {
        setError('Вакансия недоступна или уже была изменена. Список будет обновлён.');
      }
    } else if (res.status === 400) {
      setError(res.error || 'Некорректный идентификатор вакансии.');
    } else if (res.status === 500) {
      setError(res.error || (isArchiving ? 'Ошибка архивации вакансии.' : 'Ошибка восстановления вакансии.'));
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
    setDeleteModalOpen(false);
    setVacancyToDelete(null);
    if (!res.error) await load();
  }

  // До завершения проверки роли не рендерим содержимое, чтобы избежать мерцания
  if (!authChecked) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои вакансии</h1>
          <p className="text-sm text-gray-500">Управление вакансиями компании</p>
        </div>
        {!isCompanyMissing && (
          <button onClick={goToCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
            Добавить вакансию
          </button>
        )}
      </div>

      {isCompanyMissing && (
        <div className="mb-4 p-4 rounded-lg bg-yellow-50 text-yellow-800 text-sm border border-yellow-200">
          Сначала создайте профиль компании, чтобы публиковать вакансии.{" "}
          <Link href="/employer/addcompany" className="text-blue-600 font-medium hover:underline">
            Перейти к созданию компании
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => handleChangeTab(true)}
            className={`px-3 py-2 ${showActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Активные вакансии
          </button>
          <button
            type="button"
            onClick={() => handleChangeTab(false)}
            className={`px-3 py-2 border-l border-gray-200 ${!showActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Архивные вакансии
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию вакансии..."
            className="w-full md:w-80 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => {}}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 whitespace-nowrap"
          >
            Поиск
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading && (
        <div className="mb-4 p-3 rounded-lg bg-gray-50 text-gray-600 text-sm">Загрузка...</div>
      )}

      {/* Пустое состояние */}
      {!loading && filtered.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-xl p-8 bg-white text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Пока нет вакансий</h3>
          <p className="text-sm text-gray-500 mt-1">Создайте первую вакансию, чтобы начать привлекать кандидатов</p>
          {!isCompanyMissing && (
            <button onClick={goToCreate} className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
              <span>Добавить вакансию</span>
            </button>
          )}
        </div>
      )}

      {/* Список в табличном формате */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Вакансия</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Отклики</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Резюме</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((v) => (
                <tr key={v.job_id ?? v.title} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{v.title}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {v.job_id ? (
                      <Link href={`/employer/vacancies/${v.job_id}/applications`} className="text-sm text-blue-600 font-medium hover:underline">
                        {applicationCounts[v.job_id] ?? 0}
                      </Link>
                    ) : (
                      <div className="text-sm text-gray-400">0</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm text-gray-700">0</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => goToEdit(v.job_id)}
                        className="p-1.5 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Редактировать"
                        disabled={isCompanyMissing}
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      {showActive ? (
                        <button
                          onClick={() => handleDeleteClick(v)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Переместить в архив"
                          disabled={isCompanyMissing}
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h3.999A2 2 0 0116 5v2"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteClick(v)}
                          className="px-2 py-1 text-xs rounded border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isCompanyMissing}
                        >
                          Восстановить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
          <div>
            Показано {filtered.length} из {total || filtered.length} вакансий
            {total > pageSize && (
              <span>
                {` (страница ${page} из ${Math.max(1, Math.ceil(total / pageSize))})`}
              </span>
            )}
          </div>
          {total > pageSize && (
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-2 py-1 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Вперёд
              </button>
            </div>
          )}
        </div>
      )}

      {/* FAB для мобильных */}
      {!isCompanyMissing && (
        <button
          onClick={goToCreate}
          className="lg:hidden fixed bottom-6 right-6 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700"
          aria-label="Добавить вакансию"
        >
          <span className="text-2xl leading-none">＋</span>
        </button>
      )}

      {/* Модальное окно подтверждения архивации/восстановления */}
      {deleteModalOpen && vacancyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {showActive ? 'Перенос вакансии в архив' : 'Восстановление вакансии из архива'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {showActive
                ? `Вы уверены, что хотите перенести вакансию "${vacancyToDelete.title}" в архив?`
                : `Вы уверены, что хотите восстановить вакансию "${vacancyToDelete.title}" из архива?`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteModalOpen(false)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">
                Отмена
              </button>
              <button onClick={confirmDelete} className="px-3 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white">
                {showActive ? 'В архив' : 'Восстановить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
