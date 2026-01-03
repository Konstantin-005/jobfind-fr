/**
 * @file: app/employer/vacancies/[id]/applications/VacancyApplicationsPageClient.tsx
 * @description: Клиентский компонент страницы откликов по вакансии для работодателя с фильтрацией по статусам.
 * @dependencies: app/config/api.ts
 * @created: 2025-12-19
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_ENDPOINTS } from '../../../../config/api';
import { useChat } from '../../../../context/ChatContext';

type LastWorkExperience = {
  company_name?: string;
  position?: string;
  profession?: string;
  start_month?: number;
  start_year?: number;
  end_month?: number;
  end_year?: number;
  is_current?: boolean;
};

type Application = {
  application_id: number;
  applicant_id: number;
  resume_id?: number;
  resume_title?: string;
  link_uuid?: string;
  full_name?: string;
  age_years?: number;
  photo_url?: string;
  email?: string;
  phone?: string;
  phone_comment?: string;
  whatsapp?: string | null;
  telegram?: string | null;
  salary_expectation?: number;
  cover_letter?: string;
  applied_date: string;
  employer_status: string;
  viewed?: string;
  resume_updated_at?: string;
  total_experience_years?: number;
  total_experience_months?: number;
  last_work_experience?: LastWorkExperience;
  chat_room_id?: number;
};

type StatusCounts = {
  job_id: number;
  total_count: number;
  by_employer_status: Record<EmployerStatus, number>;
};

type EmployerStatus =
  | 'not_processed'
  | 'in_progress'
  | 'thinking'
  | 'processing'
  | 'test_task'
  | 'interview'
  | 'job_offer'
  | 'onboarding'
  | 'rejected';

const STATUS_LABELS: Record<EmployerStatus | 'all', string> = {
  all: 'Все',
  not_processed: 'Неразобранные',
  in_progress: 'Просмотренные',
  thinking: 'Подумать',
  processing: 'В обработке',
  test_task: 'Тестовое задание',
  interview: 'Собеседование',
  job_offer: 'Предложение о работе',
  onboarding: 'Выход на работу',
  rejected: 'Отказ',
};

const INVITE_OPTIONS: { status: EmployerStatus; label: string; icon: string }[] = [
  { status: 'thinking', label: 'Подумать', icon: '🤔' },
  { status: 'processing', label: 'В обработке', icon: '⚙️' },
  { status: 'test_task', label: 'Тестовое задание', icon: '🧪' },
  { status: 'interview', label: 'Собеседование', icon: '🤝' },
  { status: 'job_offer', label: 'Предложение о работе', icon: '💼' },
];

export default function VacancyApplicationsPageClient() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id ? Number(params.id) : null;
  const { openChatWithRoom } = useChat();

  const [authChecked, setAuthChecked] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EmployerStatus>('not_processed');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [showInviteMenu, setShowInviteMenu] = useState<number | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);

  // Сброс выделения при смене статуса или страницы
  useEffect(() => {
    setSelectedApplications([]);
  }, [selectedStatus, page]);

  // Обработчик выбора всех откликов на странице
  const toggleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map((app) => app.application_id));
    }
  };

  // Массовый отказ
  const handleBulkReject = async () => {
    if (!confirm(`Вы уверены, что хотите отказать ${selectedApplications.length} кандидатам?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.applications.bulkEmployerStatus, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          application_ids: selectedApplications,
          status: 'rejected',
        }),
      });

      if (!res.ok) {
        throw new Error('Не удалось обновить статусы');
      }

      await res.json();

      // Обновляем статус в локальном состоянии
      setApplications((prev) =>
        prev.map((app) =>
          selectedApplications.includes(app.application_id) ? { ...app, employer_status: 'rejected' } : app
        )
      );

      // Сбрасываем выделение
      setSelectedApplications([]);

      // Перезагружаем счетчики
      if (jobId) {
        const countsRes = await fetch(API_ENDPOINTS.applications.counts(jobId), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (countsRes.ok) {
          const countsData = await countsRes.json();
          setStatusCounts(countsData);
        }
      }
    } catch (e: any) {
      console.error('Failed to bulk reject:', e);
      alert(e.message || 'Произошла ошибка при массовом отказе');
    }
  };

  // Обработчик выбора отклика
  const toggleApplicationSelection = (applicationId: number) => {
    setSelectedApplications((prev) => (prev.includes(applicationId) ? prev.filter((id) => id !== applicationId) : [...prev, applicationId]));
  };

  // Обновление статуса заявки
  const updateApplicationStatus = async (applicationId: number, newStatus: EmployerStatus) => {
    setUpdatingStatus(applicationId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.applications.updateEmployerStatus(applicationId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Не удалось обновить статус');
      }

      // Обновляем статус в локальном состоянии
      setApplications((prev) =>
        prev.map((app) => (app.application_id === applicationId ? { ...app, employer_status: newStatus } : app))
      );

      // Перезагружаем счетчики
      if (jobId) {
        const countsRes = await fetch(API_ENDPOINTS.applications.counts(jobId), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (countsRes.ok) {
          const data = await countsRes.json();
          setStatusCounts(data);
        }
      }
    } catch (e: any) {
      console.error('Failed to update status:', e);
      alert(e.message || 'Произошла ошибка при обновлении статуса');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleMarkAsViewed = (applicationId: number) => {
    updateApplicationStatus(applicationId, 'in_progress');
  };

  const handleReject = (applicationId: number) => {
    if (confirm('Вы уверены, что хотите отказать этому кандидату?')) {
      updateApplicationStatus(applicationId, 'rejected');
    }
  };

  const handleInvite = (applicationId: number, inviteType: EmployerStatus) => {
    setShowInviteMenu(null);
    updateApplicationStatus(applicationId, inviteType);
  };

  const toggleInviteMenu = (applicationId: number) => {
    setShowInviteMenu((prev) => (prev === applicationId ? null : applicationId));
  };

  const handleJobOfferNext = (applicationId: number) => {
    updateApplicationStatus(applicationId, 'onboarding');
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showInviteMenu !== null
      ) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowInviteMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInviteMenu]);

  // Проверка роли работодателя
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

  // Загрузка счетчиков статусов
  useEffect(() => {
    if (!jobId || !authChecked) return;

    async function loadCounts() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.applications.counts(jobId), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.ok) {
          const data = await res.json();
          setStatusCounts(data);
        }
      } catch (e) {
        console.error('Failed to load status counts:', e);
      }
    }

    loadCounts();
  }, [jobId, authChecked]);

  // Загрузка откликов
  useEffect(() => {
    if (!jobId || !authChecked) return;

    async function loadApplications() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          page: String(page),
          limit: '50',
          employer_status: selectedStatus,
        });

        const res = await fetch(`${API_ENDPOINTS.applications.byJob(jobId)}?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          throw new Error('Не удалось загрузить отклики');
        }

        const data = await res.json();
        setApplications(data.items || []);
        setTotalCount(data.meta?.total_count || 0);
      } catch (e: any) {
        setError(e.message || 'Произошла ошибка при загрузке откликов');
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, [jobId, selectedStatus, page, authChecked]);

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  // Форматирование опыта работы
  const formatExperience = (years?: number, months?: number) => {
    if (!years && !months) return 'Нет опыта';
    const parts = [];
    if (years) parts.push(`${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`);
    if (months) parts.push(`${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`);
    return parts.join(' ');
  };

  if (!authChecked) return null;

  if (!jobId) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="text-red-600">Некорректный ID вакансии</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Заголовок */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/employer/vacancies')}
          className="text-sm text-blue-600 hover:underline mb-2 flex items-center gap-1"
        >
          ← Назад к вакансиям
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Отклики по вакансии</h1>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Основной контент с боковой панелью */}
      <div className="flex gap-6">
        {/* Левая боковая панель - фильтры */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Фильтры по статусам</h3>
            <div className="space-y-2">
              {(
                ['not_processed', 'in_progress', 'thinking', 'processing', 'test_task', 'interview', 'job_offer', 'onboarding', 'rejected'] as EmployerStatus[]
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{STATUS_LABELS[status]}</span>
                    {statusCounts && statusCounts.by_employer_status[status] > 0 && (
                      <span className={`text-xs ${selectedStatus === status ? 'text-white' : 'text-gray-500'}`}>
                        {statusCounts.by_employer_status[status]}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Правая часть - список откликов */}
        <div className="flex-1 min-w-0">
          {/* Загрузка */}
          {loading && <div className="mb-4 p-3 rounded-lg bg-gray-50 text-gray-600 text-sm">Загрузка...</div>}

          {/* Пустое состояние */}
          {!loading && applications.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 bg-white text-center">
              <h3 className="text-lg font-semibold text-gray-900">Нет откликов</h3>
              <p className="text-sm text-gray-500 mt-1">Нет откликов со статусом "{STATUS_LABELS[selectedStatus]}"</p>
            </div>
          )}

          {/* Панель массовых действий */}
          {!loading && applications.length > 0 && !['onboarding', 'rejected'].includes(selectedStatus) && (
            <div className="mb-4 flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={toggleSelectAll}
                className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
                  selectedApplications.length === applications.length && applications.length > 0
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-transparent hover:border-gray-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <div className="flex-1 text-sm text-gray-600">
                {selectedApplications.length > 0 ? (
                  <span>
                    Выбрано: <b>{selectedApplications.length}</b>
                  </span>
                ) : (
                  <span>Выбрать все</span>
                )}
              </div>

              {selectedApplications.length > 0 && (
                <button
                  onClick={handleBulkReject}
                  className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Отказать всем ({selectedApplications.length})
                </button>
              )}
            </div>
          )}

          {/* Список откликов */}
          {!loading && applications.length > 0 && (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.application_id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {/* Основная информация */}
                    <div className="flex-1 min-w-0">
                      {/* Дата отклика */}
                      <div className="text-sm text-gray-500 mb-1">Отклик от {formatDate(app.applied_date)}</div>

                      {/* Название резюме */}
                      {app.resume_title && app.link_uuid ? (
                        <a
                          href={`/resume/${app.link_uuid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-lg font-semibold mb-1 hover:underline"
                        >
                          <span>{app.resume_title}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 17L17 7M10 7h7v7"
                            />
                          </svg>
                        </a>
                      ) : (
                        app.resume_title && (
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{app.resume_title}</h3>
                        )
                      )}

                      {/* ФИО и возраст */}
                      <div className="mb-2">
                        {app.full_name || 'Имя не указано'}
                        {app.age_years && <span>, {app.age_years} лет</span>}
                      </div>

                      {/* Опыт работы */}
                      <div className="mb-3">
                        <div className="text-sm">
                          <span className="font-medium">Опыт работы:</span>{' '}
                          {formatExperience(app.total_experience_years, app.total_experience_months)}
                        </div>
                        {app.last_work_experience && (
                          <div className="text-sm mt-1">
                            <span className="font-medium">Последнее место работы:</span>{' '}
                            {app.last_work_experience.company_name && <span>{app.last_work_experience.company_name}</span>}
                            {app.last_work_experience.position && <span> • {app.last_work_experience.position}</span>}
                            {app.last_work_experience.profession && <span> • {app.last_work_experience.profession}</span>}
                            {app.last_work_experience.start_year && (
                              <span>
                                {' '}• {app.last_work_experience.start_month}/{app.last_work_experience.start_year} —{' '}
                                {app.last_work_experience.is_current
                                  ? 'настоящее время'
                                  : `${app.last_work_experience.end_month}/${app.last_work_experience.end_year}`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Контакты */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 text-sm">
                        {app.phone && (
                          <div className="flex items-center gap-2">
                            <a href={`tel:+${app.phone}`} className="text-black-600 hover:underline">
                              +{app.phone}
                            </a>
                          </div>
                        )}
                        {app.whatsapp && app.whatsapp.trim() !== '' && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">WhatsApp:</span>
                            <span>{app.whatsapp}</span>
                          </div>
                        )}
                        {app.telegram && app.telegram.trim() !== '' && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Telegram:</span>
                            <span>{app.telegram}</span>
                          </div>
                        )}
                        {app.email && <div>{app.email}</div>}
                      </div>

                      {/* Действия */}
                      <div className="flex items-center gap-2">
                        {/* Чекбокс выбора */}
                        {!['onboarding', 'rejected'].includes(app.employer_status) && (
                          <button
                            onClick={() => toggleApplicationSelection(app.application_id)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
                              selectedApplications.includes(app.application_id)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 text-transparent hover:border-gray-400'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}

                        {/* Кнопка Пригласить с выпадающим меню */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              if (['not_processed', 'in_progress'].includes(app.employer_status as EmployerStatus)) {
                                toggleInviteMenu(app.application_id);
                              } else if (app.employer_status === 'job_offer') {
                                handleJobOfferNext(app.application_id);
                              }
                            }}
                            disabled={updatingStatus === app.application_id || app.employer_status === 'onboarding'}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              app.employer_status === 'onboarding'
                                ? 'bg-blue-50 text-blue-600 cursor-default'
                                : ['not_processed', 'in_progress'].includes(app.employer_status as EmployerStatus)
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                                  : INVITE_OPTIONS.some((opt) => opt.status === app.employer_status)
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                                    : 'bg-gray-100 text-gray-600 cursor-default'
                            }`}
                          >
                            {updatingStatus === app.application_id
                              ? 'Обновление...'
                              : app.employer_status === 'onboarding'
                                ? '🎉 Выход на работу'
                                : (() => {
                                    const current = INVITE_OPTIONS.find((opt) => opt.status === app.employer_status);
                                    if (current) {
                                      return (
                                        <span className="flex items-center gap-1">
                                          {current.icon} {current.label}
                                          {['not_processed', 'in_progress'].includes(app.employer_status as EmployerStatus) && (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          )}
                                        </span>
                                      );
                                    }
                                    if (['not_processed', 'in_progress'].includes(app.employer_status as EmployerStatus)) {
                                      return (
                                        <span className="flex items-center gap-1">
                                          Пригласить
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </span>
                                      );
                                    }
                                    if (app.employer_status === 'job_offer') {
                                      return '💼 Предложение о работе';
                                    }
                                    return 'Пригласить';
                                  })()}
                          </button>

                          {showInviteMenu === app.application_id && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[220px]">
                              {INVITE_OPTIONS.map((option, idx) => (
                                <button
                                  key={option.status}
                                  onClick={() => handleInvite(app.application_id, option.status)}
                                  className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 ${
                                    idx === 0 ? 'rounded-t-lg' : ''
                                  } ${idx === INVITE_OPTIONS.length - 1 ? 'rounded-b-lg' : ''}`}
                                >
                                  {option.icon} {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleReject(app.application_id)}
                          disabled={updatingStatus === app.application_id || app.employer_status === 'rejected'}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            app.employer_status === 'rejected'
                              ? 'bg-red-50 text-red-600 cursor-default'
                              : 'border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 disabled:opacity-50'
                          }`}
                        >
                          {updatingStatus === app.application_id
                            ? 'Обновление...'
                            : app.employer_status === 'rejected'
                              ? '✗ Отказано'
                              : 'Отказать'}
                        </button>
                        <button
                          onClick={() => openChatWithRoom(app.chat_room_id)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                          disabled={!app.chat_room_id}
                          title={!app.chat_room_id ? 'Чат для этого отклика ещё не создан' : undefined}
                        >
                          Написать в чат
                        </button>
                        {app.employer_status === 'not_processed' && (
                          <button
                            onClick={() => handleMarkAsViewed(app.application_id)}
                            disabled={updatingStatus === app.application_id}
                            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            {updatingStatus === app.application_id ? 'Обновление...' : 'Просмотрено'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Фото */}
                    <div className="flex-shrink-0">
                      {app.photo_url ? (
                        (() => {
                          const raw = app.photo_url;
                          const photoSrc = raw.startsWith('http') || raw.startsWith('/')
                            ? raw
                            : `/uploads/photo/${raw}`;
                          return (
                            <img
                              src={photoSrc}
                              alt={app.full_name || 'Кандидат'}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          );
                        })()
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Пагинация */}
          {totalCount > 50 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Страница {page} из {Math.ceil(totalCount / 50)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(totalCount / 50)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперед
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
