/**
 * @file: app/employer/vacancies/[id]/applications/VacancyApplicationsPageClient.tsx
 * @description: Клиентский компонент страницы откликов по вакансии для работодателя с фильтрацией по статусам.
 * @dependencies: app/config/api.ts
 * @created: 2025-12-19
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_ENDPOINTS } from "../../../../config/api";
import { useChat } from "../../../../context/ChatContext";

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
  job_title?: string;
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  link_uuid?: string;
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
  | "not_processed"
  | "in_progress"
  | "thinking"
  | "processing"
  | "test_task"
  | "interview"
  | "job_offer"
  | "onboarding"
  | "rejected";

const STATUS_LABELS: Record<EmployerStatus | "all", string> = {
  all: "Все",
  not_processed: "Неразобранные",
  in_progress: "Просмотренные",
  thinking: "Подумать",
  processing: "В обработке",
  test_task: "Тестовое задание",
  interview: "Собеседование",
  job_offer: "Предложение о работе",
  onboarding: "Выход на работу",
  rejected: "Отказ",
};

const STATUS_OPTIONS: { status: EmployerStatus; label: string; icon: string }[] = [
  { status: "thinking", label: "Подумать", icon: "🤔" },
  { status: "processing", label: "В обработке", icon: "⚙️" },
  { status: "test_task", label: "Тестовое задание", icon: "🧪" },
  { status: "interview", label: "Собеседование", icon: "🤝" },
  { status: "job_offer", label: "Предложение о работе", icon: "💼" },
  { status: "onboarding", label: "Выход на работу", icon: "🎉" },
  { status: "rejected", label: "Отказ", icon: "✗" },
  { status: "in_progress", label: "Просмотрено", icon: "👁️" },
];

const MODAL_STATUS_ORDER: EmployerStatus[] = [
  "thinking",
  "processing",
  "test_task",
  "interview",
  "job_offer",
  "onboarding",
  "rejected",
  "in_progress",
];

const STATUS_TRANSITIONS: Record<EmployerStatus, EmployerStatus[]> = {
  not_processed: ["thinking", "processing", "test_task", "interview", "job_offer", "onboarding", "rejected"],
  in_progress: ["thinking", "processing", "test_task", "interview", "job_offer", "onboarding", "rejected"],
  thinking: ["processing", "test_task", "interview", "job_offer", "onboarding", "rejected"],
  processing: ["test_task", "interview", "job_offer", "onboarding", "rejected"],
  test_task: ["interview", "job_offer", "onboarding", "rejected"],
  interview: ["job_offer", "onboarding", "rejected"],
  job_offer: ["onboarding", "rejected"],
  onboarding: ["rejected"],
  rejected: [],
};

const getStatusLabelWithIcon = (status: EmployerStatus) => {
  const found = STATUS_OPTIONS.find((opt) => opt.status === status);
  if (found) return `${found.icon} ${found.label}`;
  return STATUS_LABELS[status] || status;
};

const formatFullName = (app: Application) => {
  const parts = [app.last_name, app.first_name, app.middle_name]
    .map((p) => (p || "").trim())
    .filter(Boolean);
  return parts.join(" ").trim();
};

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
  const [selectedStatus, setSelectedStatus] = useState<EmployerStatus>("not_processed");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyNameLoading, setCompanyNameLoading] = useState(false);

  const [statusModal, setStatusModal] = useState<{
    applications: Application[];
    initialStatus: EmployerStatus; // фактический текущий статус в списке
    suggestedStatus: EmployerStatus; // предложенный статус по deriveInitialStatus
    isBulkAction?: boolean;
  } | null>(null);
  const [modalSelectedStatus, setModalSelectedStatus] = useState<EmployerStatus>("thinking");
  const [modalMessage, setModalMessage] = useState("");
  const [modalSendMessage, setModalSendMessage] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalMessageEdited, setModalMessageEdited] = useState(false);

  // Сброс выделения при смене статуса или страницы
  useEffect(() => {
    setSelectedApplications([]);
  }, [selectedStatus, page]);

  const ensureCompanyName = async () => {
    if (companyName || companyNameLoading) return;
    setCompanyNameLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.companies.profile, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.company_name) {
          setCompanyName(data.company_name);
        }
      }
    } catch (e) {
      console.warn("Не удалось загрузить название компании", e);
    } finally {
      setCompanyNameLoading(false);
    }
  };

  const buildDefaultMessage = (
    status: EmployerStatus,
    app: Application,
    company?: string | null,
    options?: { includeApplicantName?: boolean }
  ) => {
    const includeApplicantName = options?.includeApplicantName !== false;
    const firstName = (app.first_name && app.first_name.trim()) || "кандидат";
    const resumeTitle = app.resume_title || "вашу заявку";
    const companyLabel = company || "нашей компании";
    const greeting = includeApplicantName ? `Здравствуйте, ${firstName}!` : "Здравствуйте!";

    switch (status) {
      case "thinking":
        return `${greeting}\n\nКомпания ${companyLabel} рассмотрит ваше резюме "${resumeTitle}" и сообщит Вам о своём решении.\n\nС уважением,\n${companyLabel}`;
      case "processing":
        return greeting;
      case "test_task":
        return `${greeting}\n\nХотим предложить вам выполнить тестовое задание. Пожалуйста, уточните удобный срок выполнения.\n\nС уважением,\n${companyLabel}`;
      case "interview":
        return `${greeting}\n\nПриглашаем Вас на собеседование. Дата и время: .\n\nС уважением,\n${companyLabel}`;
      case "job_offer":
        return `${greeting}\n\nМы хотим предложить Вам работу. Давайте обсудим детали и любые ваши вопросы.\n\nС уважением,\n${companyLabel}`;
      case "onboarding":
        return `${greeting}\n\nРады, что Вы присоединяетесь к ${companyLabel}! Подготовим все необходимые документы и расскажем о следующих шагах.\n\nС уважением,\n${companyLabel}`;
      case "rejected":
        return `${greeting}\n\nСпасибо за интерес к нашей вакансии. К сожалению, сейчас мы не готовы продолжить общение дальше. Мы сохраним ваше резюме и свяжемся, если появится подходящая возможность.\n\nС уважением,\n${companyLabel}`;
      case "in_progress":
        return `${greeting}\n\nМы внимательно изучили ваше резюме "${resumeTitle}" и продолжаем рассмотрение. Сообщим о решении в ближайшее время.\n\nС уважением,\n${companyLabel}`;
      default:
        return `${greeting}\n\nСпасибо за интерес к ${companyLabel}.\n\nС уважением,\n${companyLabel}`;
    }
  };

  const openStatusModal = (applicationsToUpdate: Application[], preferred: EmployerStatus, isBulkAction: boolean = false) => {
    const baseApp = applicationsToUpdate[0];
    const baseStatus = (baseApp.employer_status as EmployerStatus) || preferred;
    const nextStatus = deriveInitialStatus(baseApp, preferred);
    const isBulk = applicationsToUpdate.length > 1 || isBulkAction;

    setStatusModal({ applications: applicationsToUpdate, initialStatus: baseStatus, suggestedStatus: nextStatus, isBulkAction });
    setModalSelectedStatus(nextStatus);
    setModalMessage(buildDefaultMessage(nextStatus, baseApp, companyName, { includeApplicantName: !isBulk }));
    setModalSendMessage(true);
    setModalMessageEdited(false);
    ensureCompanyName();
  };

  useEffect(() => {
    if (!statusModal || !companyName || modalMessageEdited) return;
    const baseApp = statusModal.applications[0];
    const isBulk = statusModal.applications.length > 1 || statusModal.isBulkAction;
    setModalMessage(buildDefaultMessage(modalSelectedStatus, baseApp, companyName, { includeApplicantName: !isBulk }));
  }, [companyName, statusModal, modalSelectedStatus, modalMessageEdited]);

  // Обработчик выбора всех откликов на странице
  const toggleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map((app) => app.application_id));
    }
  };

  const deriveInitialStatus = (app: Application, preferred?: EmployerStatus): EmployerStatus => {
    if (preferred) return preferred;

    const current = app.employer_status as EmployerStatus;
    const allowed = STATUS_TRANSITIONS[current];
    if (allowed && allowed.length > 0) {
      return allowed[0];
    }

    if (current === "job_offer") return "onboarding";
    if (current === "not_processed" || current === "in_progress") return "thinking";
    if (MODAL_STATUS_ORDER.includes(current)) {
      return current;
    }

    return "thinking";
  };

  // Массовый отказ / смена статуса выбранных
  const handleBulkStatusChange = (targetStatus: EmployerStatus) => {
    const apps = applications.filter((app) => selectedApplications.includes(app.application_id));
    if (apps.length === 0) return;
    openStatusModal(apps, targetStatus, true);
  };

  // Обработчик выбора отклика
  const toggleApplicationSelection = (applicationId: number) => {
    setSelectedApplications((prev) => (prev.includes(applicationId) ? prev.filter((id) => id !== applicationId) : [...prev, applicationId]));
  };

  const handleReject = (applicationId: number) => {
    const app = applications.find((a) => a.application_id === applicationId);
    if (!app) return;
    openStatusModal([app], "rejected", false);
  };

  const handleOpenStatusModal = (app: Application, preferred?: EmployerStatus) => {
    openStatusModal([app], deriveInitialStatus(app, preferred), false);
  };

  const handleMarkAsViewed = async (applicationId: number) => {
    const app = applications.find((a) => a.application_id === applicationId);
    if (!app) return;

    setUpdatingStatus(applicationId);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const payload = { status: "in_progress" };
      const res = await fetch(API_ENDPOINTS.applications.updateEmployerStatus(applicationId), {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to mark as viewed", res.status);
        return;
      }

      setApplications((prev) => {
        if (selectedStatus === "not_processed") {
          return prev.filter((a) => a.application_id !== applicationId);
        }
        return prev.map((a) =>
          a.application_id === applicationId ? { ...a, employer_status: "in_progress" } : a
        );
      });
      setSelectedApplications((prev) => prev.filter((id) => id !== applicationId));
      setStatusCounts((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        const by = { ...next.by_employer_status };
        by.not_processed = Math.max(0, (by.not_processed || 0) - 1);
        by.in_progress = (by.in_progress || 0) + 1;
        next.by_employer_status = by;
        return next;
      });
      if (selectedStatus === "not_processed") {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Mark as viewed error", e);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCloseModal = () => {
    setStatusModal(null);
    setModalSubmitting(false);
  };

  const refreshCounts = async () => {
    if (!jobId) return;
    const token = localStorage.getItem("token");
    const res = await fetch(API_ENDPOINTS.applications.counts(jobId), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) {
      const data = await res.json();
      setStatusCounts(data);
    }
  };

  const applyStatusUpdateLocally = (appIds: number[], status: EmployerStatus) => {
    setApplications((prev) => prev.map((app) => (appIds.includes(app.application_id) ? { ...app, employer_status: status } : app)));
  };

  const handleModalSubmit = async () => {
    if (!statusModal) return;
    const appIds = statusModal.applications.map((a) => a.application_id);
    setModalSubmitting(true);
    setUpdatingStatus(appIds.length === 1 ? appIds[0] : null);

    try {
      const token = localStorage.getItem("token");
      const payload: { status: EmployerStatus; message?: string } = {
        status: modalSelectedStatus,
      };
      const trimmed = modalMessage.trim();
      if (modalSendMessage && trimmed) {
        payload.message = trimmed;
      }

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let res: Response;
      if (appIds.length === 1) {
        res = await fetch(API_ENDPOINTS.applications.updateEmployerStatus(appIds[0]), {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(API_ENDPOINTS.applications.bulkEmployerStatus, {
          method: "PUT",
          headers,
          body: JSON.stringify({ application_ids: appIds, ...payload }),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to update status:", errorData);
        alert(`Ошибка при обновлении статуса: ${errorData?.message || res.statusText}`);
        return;
      }

      const newStatus = modalSelectedStatus;
      const initialStatus = statusModal.initialStatus;

      setApplications((prev) => {
        const idSet = new Set(appIds);
        const removeFromCurrent =
          selectedStatus === initialStatus && newStatus !== selectedStatus;

        if (removeFromCurrent) {
          return prev.filter((app) => !idSet.has(app.application_id));
        }

        return prev.map((app) =>
          idSet.has(app.application_id) ? { ...app, employer_status: newStatus } : app
        );
      });

      setSelectedApplications((prev) => prev.filter((id) => !appIds.includes(id)));

      setStatusCounts((prev) => {
        if (!prev) return prev;
        const next = { ...prev, by_employer_status: { ...prev.by_employer_status } };

        if (initialStatus !== newStatus) {
          const delta = appIds.length;
          next.by_employer_status[initialStatus] = Math.max(0, (next.by_employer_status[initialStatus] || 0) - delta);
          next.by_employer_status[newStatus] = (next.by_employer_status[newStatus] || 0) + delta;
        }

        return next;
      });

      if (selectedStatus === initialStatus && newStatus !== selectedStatus) {
        setTotalCount((prev) => Math.max(0, prev - appIds.length));
      }

      handleCloseModal();
      refreshApplications();
      refreshCounts();
    } catch (e) {
      console.error("Status update error", e);
      alert("Произошла ошибка при обновлении статуса.");
    } finally {
      setModalSubmitting(false);
      setUpdatingStatus(null);
    }
  };

  const renderStatusModal = () => {
    if (!statusModal) return null;
    const baseApp = statusModal.applications[0];
    const isBulk = statusModal.applications.length > 1 || statusModal.isBulkAction;
    const transitions = STATUS_TRANSITIONS[statusModal.initialStatus] || [];
    const allowedTransitions = transitions.length > 0 ? transitions : [statusModal.initialStatus];
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" onClick={handleCloseModal}>
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Изменить статус резюме</h2>
            <button
              onClick={handleCloseModal}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              {!isBulk && formatFullName(baseApp) && (
                <a
                  href={baseApp.link_uuid ? `/resume/${baseApp.link_uuid}` : undefined}
                  target={baseApp.link_uuid ? "_blank" : undefined}
                  rel={baseApp.link_uuid ? "noopener noreferrer" : undefined}
                  className={`text-base font-semibold text-blue-700 ${baseApp.link_uuid ? "hover:underline" : "cursor-default text-gray-900"}`}
                >
                  {formatFullName(baseApp)}
                </a>
              )}
              {!isBulk && baseApp.resume_title && (
                <div className="text-sm text-gray-800">
                  {baseApp.resume_title}
                  {baseApp.link_uuid && (
                    <a
                      href={`/resume/${baseApp.link_uuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline ml-2"
                    >
                      Открыть резюме
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M10 7h7v7" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
              {isBulk && (
                <div className="text-sm text-gray-600">
                  Выбрано откликов: <b>{statusModal.applications.length}</b>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Статус</label>
              <select
                value={modalSelectedStatus}
                onChange={(e) => {
                  const next = e.target.value as EmployerStatus;
                  setModalSelectedStatus(next);
                  setModalMessageEdited(false);
                  if (!modalSendMessage) {
                    setModalSendMessage(true);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {MODAL_STATUS_ORDER.filter((status) => isBulk ? status === "rejected" : allowedTransitions.includes(status)).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <input
                type="checkbox"
                checked={modalSendMessage}
                onChange={(e) => setModalSendMessage(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              Отправить сообщение
            </label>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Сообщение</label>
              <textarea
                value={modalMessage}
                onChange={(e) => {
                  setModalMessage(e.target.value);
                  setModalMessageEdited(true);
                }}
                disabled={!modalSendMessage}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[140px] disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="Сообщение кандидату"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>В сообщение подставляется название вашей компании.</span>
                <span>{modalMessage.length}/5000</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white"
              disabled={modalSubmitting}
            >
              Назад
            </button>
            <button
              type="button"
              onClick={handleModalSubmit}
              disabled={modalSubmitting}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {modalSubmitting && <span className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
              <span>Изменить статус</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  const refreshApplications = useCallback(async () => {
    if (!jobId || !authChecked) return;

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
  }, [jobId, authChecked, page, selectedStatus]);

  // Загрузка откликов
  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

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
    <>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Заголовок */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/employer/vacancies')}
            className="text-sm text-blue-600 hover:underline mb-2 flex items-center gap-1"
          >
            ← Назад к вакансиям
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Отклики по вакансии
            {applications.length > 0 && applications[0].job_title && (
              <span className="font-normal text-gray-700">: {applications[0].job_title}</span>
            )}
          </h1>
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
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
                  className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${selectedApplications.length === applications.length && applications.length > 0
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
                    onClick={() => handleBulkStatusChange("rejected")}
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
                          {formatFullName(app) || 'Имя не указано'}
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
                              className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${selectedApplications.includes(app.application_id)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 text-transparent hover:border-gray-400'
                                }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}

                          {/* Кнопка смены статуса */}
                          {app.employer_status !== 'onboarding' && app.employer_status !== 'rejected' && (
                            <button
                              onClick={() => handleOpenStatusModal(app)}
                              disabled={updatingStatus === app.application_id}
                              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {updatingStatus === app.application_id ? 'Обновление...' : 'Изменить статус'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (app.employer_status === 'rejected') return;
                              handleOpenStatusModal(app, 'rejected');
                            }}
                            disabled={updatingStatus === app.application_id || app.employer_status === 'rejected'}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${app.employer_status === 'rejected'
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
                                alt={formatFullName(app) || 'Кандидат'}
                                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                              />
                            );
                          })()
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center border border-gray-200">
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
      {renderStatusModal()}
    </>
  );
}
