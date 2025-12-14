/**
 * @file: app/employer/vacancies/[id]/applications/page.tsx
 * @description: Страница откликов по вакансии для работодателя с фильтрацией по статусам
 * @dependencies: app/config/api.ts
 * @created: 2025-12-05
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_ENDPOINTS } from '../../../../config/api';

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
  full_name?: string;
  age_years?: number;
  photo_url?: string;
  email?: string;
  phone?: string;
  phone_comment?: string;
  has_whatsapp?: boolean;
  has_telegram?: boolean;
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
  by_employer_status: {
    not_processed: number;
    in_progress: number;
    phone_interview: number;
    evaluation: number;
    interview: number;
    job_offer: number;
    onboarding: number;
    rejected: number;
  };
};

type EmployerStatus = 'not_processed' | 'in_progress' | 'phone_interview' | 'evaluation' | 'interview' | 'job_offer' | 'onboarding' | 'rejected';

const STATUS_LABELS: Record<EmployerStatus | 'all', string> = {
  all: 'Все',
  not_processed: 'Неразобранные',
  in_progress: 'Просмотренные',
  phone_interview: 'Телефонное интервью',
  evaluation: 'Оценка',
  interview: 'Интервью',
  job_offer: 'Предложение о работе',
  onboarding: 'Выход на работу',
  rejected: 'Отказ',
};

export default function VacancyApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id ? Number(params.id) : null;

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
  const [showPhoneInterviewMenu, setShowPhoneInterviewMenu] = useState<number | null>(null);
  const [showInterviewMenu, setShowInterviewMenu] = useState<number | null>(null);
  const [showEvaluationMenu, setShowEvaluationMenu] = useState<number | null>(null);
  const [showJobOfferMenu, setShowJobOfferMenu] = useState<number | null>(null);
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
      setSelectedApplications(applications.map(app => app.application_id));
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
          status: 'rejected'
        }),
      });

      if (!res.ok) {
        throw new Error('Не удалось обновить статусы');
      }

      const data = await res.json();
      
      // Обновляем статус в локальном состоянии
      setApplications(prev => 
        prev.map(app => 
          selectedApplications.includes(app.application_id)
            ? { ...app, employer_status: 'rejected' }
            : app
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
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId) 
        : [...prev, applicationId]
    );
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
      setApplications(prev => 
        prev.map(app => 
          app.application_id === applicationId 
            ? { ...app, employer_status: newStatus }
            : app
        )
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

  const handleInvite = (applicationId: number, inviteType: 'phone_interview' | 'interview' | 'job_offer') => {
    setShowInviteMenu(null);
    updateApplicationStatus(applicationId, inviteType);
  };

  const toggleInviteMenu = (applicationId: number) => {
    setShowInviteMenu(prev => prev === applicationId ? null : applicationId);
  };

  const handlePhoneInterviewNext = (applicationId: number, nextStatus: 'evaluation' | 'interview' | 'job_offer') => {
    setShowPhoneInterviewMenu(null);
    updateApplicationStatus(applicationId, nextStatus);
  };

  const togglePhoneInterviewMenu = (applicationId: number) => {
    setShowPhoneInterviewMenu(prev => prev === applicationId ? null : applicationId);
  };

  const handleInterviewNext = (applicationId: number, nextStatus: 'evaluation' | 'job_offer') => {
    setShowInterviewMenu(null);
    updateApplicationStatus(applicationId, nextStatus);
  };

  const toggleInterviewMenu = (applicationId: number) => {
    setShowInterviewMenu(prev => prev === applicationId ? null : applicationId);
  };

  const handleEvaluationNext = (applicationId: number, nextStatus: 'interview' | 'job_offer') => {
    setShowEvaluationMenu(null);
    updateApplicationStatus(applicationId, nextStatus);
  };

  const toggleEvaluationMenu = (applicationId: number) => {
    setShowEvaluationMenu(prev => prev === applicationId ? null : applicationId);
  };

  const handleJobOfferNext = (applicationId: number) => {
    setShowJobOfferMenu(null);
    updateApplicationStatus(applicationId, 'onboarding');
  };

  const toggleJobOfferMenu = (applicationId: number) => {
    setShowJobOfferMenu(prev => prev === applicationId ? null : applicationId);
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showInviteMenu !== null || showPhoneInterviewMenu !== null || showInterviewMenu !== null || showEvaluationMenu !== null || showJobOfferMenu !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowInviteMenu(null);
          setShowPhoneInterviewMenu(null);
          setShowInterviewMenu(null);
          setShowEvaluationMenu(null);
          setShowJobOfferMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInviteMenu, showPhoneInterviewMenu, showInterviewMenu, showEvaluationMenu, showJobOfferMenu]);

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
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Основной контент с боковой панелью */}
      <div className="flex gap-6">
        {/* Левая боковая панель - фильтры */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Фильтры по статусам</h3>
            <div className="space-y-2">
              {(['not_processed', 'in_progress', 'phone_interview', 'evaluation', 'interview', 'job_offer', 'onboarding', 'rejected'] as EmployerStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => { setSelectedStatus(status); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
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
          {loading && (
            <div className="mb-4 p-3 rounded-lg bg-gray-50 text-gray-600 text-sm">Загрузка...</div>
          )}

          {/* Пустое состояние */}
          {!loading && applications.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 bg-white text-center">
              <h3 className="text-lg font-semibold text-gray-900">Нет откликов</h3>
              <p className="text-sm text-gray-500 mt-1">
                Нет откликов со статусом "{STATUS_LABELS[selectedStatus]}"
              </p>
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
                  <span>Выбрано: <b>{selectedApplications.length}</b></span>
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
            <div
              key={app.application_id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">

                {/* Основная информация */}
                <div className="flex-1 min-w-0">
                  {/* Дата отклика */}
                  <div className="text-sm text-gray-500 mb-1">
                    Отклик от {formatDate(app.applied_date)}
                  </div>

                  {/* Название резюме */}
                  {app.resume_title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {app.resume_title}
                    </h3>
                  )}

                  {/* ФИО и возраст */}
                  <div className="text-gray-600 mb-2">
                    {app.full_name || 'Имя не указано'}
                    {app.age_years && <span className="text-gray-500">, {app.age_years} лет</span>}
                  </div>

                  {/* Опыт работы */}
                  <div className="mb-3">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Опыт работы:</span>{' '}
                      {formatExperience(app.total_experience_years, app.total_experience_months)}
                    </div>
                    {app.last_work_experience && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Последнее место работы:</span>{' '}
                        {app.last_work_experience.company_name && (
                          <span>{app.last_work_experience.company_name}</span>
                        )}
                        {app.last_work_experience.position && (
                          <span> • {app.last_work_experience.position}</span>
                        )}
                        {app.last_work_experience.profession && (
                          <span> • {app.last_work_experience.profession}</span>
                        )}
                        {app.last_work_experience.start_year && (
                          <span>
                            {' '}• {app.last_work_experience.start_month}/{app.last_work_experience.start_year} —{' '}
                            {app.last_work_experience.is_current
                              ? 'настоящее время'
                              : `${app.last_work_experience.end_month}/${app.last_work_experience.end_year}`
                            }
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Контакты */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 text-sm">
                    {app.phone && (
                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:+${app.phone}`}
                          className="text-black-600 hover:underline"
                        >
                          +{app.phone}
                        </a>
                        {app.has_whatsapp && (
                          <span className="text-green-600" title="WhatsApp">WhatsApp</span>
                        )}
                        {app.has_telegram && (
                          <span className="text-blue-500" title="Telegram">Telegram</span>
                        )}
                      </div>
                    )}
                    {app.email && (
                      <div className="text-gray-600">{app.email}</div>
                    )}
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
                          if (app.employer_status === 'phone_interview') {
                            togglePhoneInterviewMenu(app.application_id);
                          } else if (app.employer_status === 'interview') {
                            toggleInterviewMenu(app.application_id);
                          } else if (app.employer_status === 'evaluation') {
                            toggleEvaluationMenu(app.application_id);
                          } else if (app.employer_status === 'job_offer') {
                            toggleJobOfferMenu(app.application_id);
                          } else if (!app.employer_status || app.employer_status === 'not_processed' || app.employer_status === 'in_progress') {
                            toggleInviteMenu(app.application_id);
                          }
                        }}
                        disabled={updatingStatus === app.application_id || app.employer_status === 'onboarding'}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          app.employer_status === 'phone_interview' || app.employer_status === 'interview' || app.employer_status === 'evaluation' || app.employer_status === 'job_offer'
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                            : app.employer_status === 'onboarding'
                              ? 'bg-blue-50 text-blue-600 cursor-default'
                              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        }`}
                      >
                        {updatingStatus === app.application_id 
                          ? 'Обновление...' 
                          : app.employer_status === 'phone_interview' 
                            ? (
                              <span className="flex items-center gap-1">
                                📞 Телефонное интервью
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </span>
                            )
                            : app.employer_status === 'evaluation'
                              ? (
                                <span className="flex items-center gap-1">
                                  📋 Оценка
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </span>
                              )
                              : app.employer_status === 'interview'
                                ? (
                                  <span className="flex items-center gap-1">
                                    🤝 Интервью
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </span>
                                )
                                : app.employer_status === 'job_offer'
                                  ? (
                                    <span className="flex items-center gap-1">
                                      💼 Предложение о работе
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </span>
                                  )
                                  : app.employer_status === 'onboarding'
                                    ? '🎉 Выход на работу'
                                    : (
                                      <span className="flex items-center gap-1">
                                        Пригласить
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </span>
                                    )
                        }
                      </button>
                      
                      {/* Выпадающее меню */}
                      {showInviteMenu === app.application_id && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[220px]">
                          <button
                            onClick={() => handleInvite(app.application_id, 'phone_interview')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            📞 Телефонное интервью
                          </button>
                          <button
                            onClick={() => handleInvite(app.application_id, 'interview')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            🤝 Интервью
                          </button>
                          <button
                            onClick={() => handleInvite(app.application_id, 'job_offer')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                          >
                            💼 Предложение о работе
                          </button>
                        </div>
                      )}
                      
                      {/* Выпадающее меню для телефонного интервью */}
                      {showPhoneInterviewMenu === app.application_id && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[220px]">
                          <button
                            onClick={() => handlePhoneInterviewNext(app.application_id, 'evaluation')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            📋 Оценка
                          </button>
                          <button
                            onClick={() => handlePhoneInterviewNext(app.application_id, 'interview')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            🤝 Интервью
                          </button>
                          <button
                            onClick={() => handlePhoneInterviewNext(app.application_id, 'job_offer')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                          >
                            💼 Предложение о работе
                          </button>
                        </div>
                      )}
                      
                      {/* Выпадающее меню для интервью */}
                      {showInterviewMenu === app.application_id && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[220px]">
                          <button
                            onClick={() => handleInterviewNext(app.application_id, 'evaluation')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            📋 Оценка
                          </button>
                          <button
                            onClick={() => handleInterviewNext(app.application_id, 'job_offer')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                          >
                            💼 Предложение о работе
                          </button>
                        </div>
                      )}
                      
                      {/* Выпадающее меню для оценки */}
                      {showEvaluationMenu === app.application_id && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[220px]">
                          <button
                            onClick={() => handleEvaluationNext(app.application_id, 'interview')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            🤝 Интервью
                          </button>
                          <button
                            onClick={() => handleEvaluationNext(app.application_id, 'job_offer')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                          >
                            💼 Предложение о работе
                          </button>
                        </div>
                      )}
                      
                      {/* Выпадающее меню для предложения о работе */}
                      {showJobOfferMenu === app.application_id && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[220px]">
                          <button
                            onClick={() => handleJobOfferNext(app.application_id)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            🎉 Выход на работу
                          </button>
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
                          : 'Отказать'
                      }
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
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
                    <img
                      src={app.photo_url}
                      alt={app.full_name || 'Кандидат'}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Страница {page} из {Math.ceil(totalCount / 50)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
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
