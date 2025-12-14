/**
 * @file: app/employer/vacancies/page.tsx
 * @description: Страница работодателя со списком вакансий и CRUD (просмотр/добавление/редактирование/удаление). Отображает количество откликов по каждой вакансии через API /api/applications/jobs/{job_id}/counts
 * @dependencies: app/utils/api.ts (jobsApi), app/config/api.ts
 * @created: 2025-10-24
 * @updated: 2025-12-05
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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


export default function EmployerVacanciesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isCompanyMissing, setIsCompanyMissing] = useState(false);
  const [items, setItems] = useState<JobPosting[]>([]);
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
    return base.filter((v) =>
      (v.title || '').toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)
    );
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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await jobsApi.listCompanyJobs();
      if (res.error) {
        setError(res.error);
      }
      const payload: any = res.data ?? [];
      const rows: JobPosting[] = Array.isArray(payload)
        ? payload
        : (payload?.items || payload?.data || payload?.job_postings || []);
      setItems(Array.isArray(rows) ? rows : []);
      
      // Загрузка количества откликов для каждой вакансии
      const jobIds = rows.filter(r => r.job_id).map(r => r.job_id!);
      if (jobIds.length > 0) {
        await loadApplicationCounts(jobIds);
      }
    } catch (e) {
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
    const res = await jobsApi.remove(vacancyToDelete.job_id);
    if (res.error) setError(res.error);
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
          Сначала создайте профиль компании, чтобы публиковать вакансии.{' '}
          <Link href="/employer/addcompany" className="text-blue-600 font-medium hover:underline">
            Перейти к созданию компании
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию или описанию..."
          className="w-full md:w-96 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={load} className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Обновить</button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
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
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Истекает</th>
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
                      <Link
                        href={`/employer/vacancies/${v.job_id}/applications`}
                        className="text-sm text-blue-600 font-medium hover:underline"
                      >
                        {applicationCounts[v.job_id] ?? 0}
                      </Link>
                    ) : (
                      <div className="text-sm text-gray-400">0</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm text-gray-700">0</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="text-sm text-gray-700">
                      {v.expiration_date ? new Date(v.expiration_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '-'}
                    </div>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(v)} 
                        className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Удалить"
                        disabled={isCompanyMissing}
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Модальное окно подтверждения удаления */}
      {deleteModalOpen && vacancyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Подтверждение удаления</h2>
            <p className="text-sm text-gray-500 mb-4">Вы уверены, что хотите удалить вакансию "{vacancyToDelete.title}"?</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteModalOpen(false)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Отмена</button>
              <button onClick={confirmDelete} className="px-3 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
