/**
 * @file: app/components/JobOfferModal.tsx
 * @description: Модалка выбора вакансии работодателя и отправки предложения по резюме
 * @dependencies: jobsApi, apiRequest, API_ENDPOINTS, React hooks
 * @created: 2025-12-31
 */

"use client";

import { useEffect, useState } from "react";
import { jobsApi, JobPosting, usersApi, UserProfile, apiRequest } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";

interface JobOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeLinkUuid: string;
  onSuccess?: (chatRoomId: number | null | undefined) => void;
}

interface JobApplicationResponse {
  application_id: number;
  job_id: number;
  resume_id?: number;
  chat_room_id?: number | null;
}

export function JobOfferModal({ isOpen, onClose, resumeLinkUuid, onSuccess }: JobOfferModalProps) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [duplicateForJobIds, setDuplicateForJobIds] = useState<Set<number>>(new Set());
  const [messageText, setMessageText] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [jobDetailsCache, setJobDetailsCache] = useState<Record<number, JobPosting>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchJobsAndProfile = async () => {
      setIsLoadingJobs(true);
      setError(null);
      setMessageError(null);
      const response = await jobsApi.listCompanyJobs({});
      if (response.error || !response.data) {
        setError(response.error || "Не удалось загрузить список вакансий.");
        setJobs([]);
      } else {
        setJobs(response.data.data || []);
      }

      // Профиль пользователя для подстановки телефона по умолчанию
      const profileResp = await usersApi.getProfile();
      if (!profileResp.error && profileResp.data) {
        setProfile(profileResp.data);
      }

      // Профиль компании для названия компании в подписи
      try {
        const companyResp = await apiRequest<{ company_name?: string }>(API_ENDPOINTS.companies.profile, {
          method: "GET",
        });
        if (!companyResp.error && companyResp.data?.company_name) {
          setCompanyName(companyResp.data.company_name);
        }
      } catch {
        // игнорируем, используем fallback из вакансии
      }

      setIsLoadingJobs(false);
    };

    fetchJobsAndProfile();
  }, [isOpen]);

  const buildDefaultMessage = (job: JobPosting, profileData: UserProfile | null) => {
    const contacts: string[] = [];

    const formatPhone = (raw: string) => {
      const trimmed = raw.trim();
      return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
    };

    if ((job as any).contact_phone) {
      contacts.push(`тел.: ${formatPhone((job as any).contact_phone)}`);
    }
    if ((job as any).contact_telegram) contacts.push(`Telegram: ${(job as any).contact_telegram}`);
    if ((job as any).contact_whatsapp) contacts.push(`WhatsApp: ${(job as any).contact_whatsapp}`);

    if (contacts.length === 0 && profileData?.phone_number) {
      contacts.push(`тел.: ${formatPhone(profileData.phone_number)}`);
    }

    const baseLine = " Пожалуйста, напишите в чат.";
    const contactsPart = contacts.length > 0
      ? `${baseLine} Или свяжитесь с нами по ${contacts.join(", ")}.`
      : baseLine;
    const companyFromJob = (job as any).company_name;
    const companyLabel = companyName || companyFromJob || "нашей компании";

    return `Здравствуйте! Мы ознакомились с вашим резюме и хотели бы предложить вам вакансию «${job.title}».${contactsPart} С уважением, ${companyLabel}.`;
  };

  const handleSubmit = async () => {
    if (!selectedJobId || !resumeLinkUuid) return;
    setIsSubmitting(true);
    setError(null);
    setMessageError(null);
    setSuccessMessage(null);
    setChatRoomId(null);

    const endpoint = `${API_ENDPOINTS.jobById(selectedJobId)}/offer`;
    const response = await apiRequest<JobApplicationResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify({
        resume_link_uuid: resumeLinkUuid,
        message_text: messageText || undefined,
      }),
    });

    setIsSubmitting(false);

    if (response.error) {
      if (response.status === 401) {
        setError("Сессия истекла. Пожалуйста, войдите в систему ещё раз.");
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user_type");
          const from = window.location.pathname + window.location.search;
          window.location.href = `/login?from=${encodeURIComponent(from)}`;
        }
        return;
      }
      if (response.status === 403) {
        setError("Этот функционал доступен только работодателям.");
        return;
      }
      if (response.status === 404) {
        setError("Вакансия или резюме недоступны или были удалены.");
        return;
      }
      if (response.status === 400) {
        if (response.error.includes("Длина сообщения не должна превышать")) {
          setMessageError("Длина сообщения не должна превышать 5000 символов.");
        } else if (
          response.error.includes("Уже есть активное предложение") ||
          response.error.includes("активное предложение")
        ) {
          setError("Вы уже отправили предложение или получили отклик от этого кандидата по этой вакансии.");
          setDuplicateForJobIds((prev) => new Set(prev).add(selectedJobId));
        } else {
          setError("Не удалось отправить предложение. Попробуйте обновить страницу.");
        }
        return;
      }
      setError("Произошла ошибка на сервере. Попробуйте повторить попытку позже.");
      return;
    }
    const data = response.data;
    const roomId = data?.chat_room_id ?? null;
    setChatRoomId(roomId);
    setSuccessMessage("Предложение по вакансии отправлено. Соискателю пришло письмо и сообщение в чат.");
    if (onSuccess) {
      onSuccess(roomId);
    }
  };

  const handleClose = () => {
    setSelectedJobId(null);
    setError(null);
    setMessageError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Предложить вакансию</h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4">
            Выберите одну из ваших вакансий, по которой хотите отправить приглашение этому соискателю.
          </p>

          {isLoadingJobs ? (
            <div className="py-6 text-center text-gray-500 text-sm">Загрузка списка вакансий…</div>
          ) : jobs.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-sm">
              У вас пока нет активных вакансий. Создайте вакансию в кабинете работодателя.
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {jobs.map((job) => {
                const isDuplicate = duplicateForJobIds.has(job.job_id!);
                return (
                  <button
                    key={job.job_id}
                    type="button"
                    onClick={async () => {
                      setSelectedJobId(job.job_id!);
                      setMessageError(null);

                      let details = jobDetailsCache[job.job_id!];
                      if (!details) {
                        const detailsResp = await jobsApi.getCompanyJob(job.job_id!);
                        if (!detailsResp.error && detailsResp.data) {
                          details = detailsResp.data;
                          setJobDetailsCache((prev) => ({ ...prev, [job.job_id!]: details! }));
                        } else {
                          details = job;
                        }
                      }

                      const defaultText = buildDefaultMessage(details, profile);
                      setMessageText(defaultText);
                    }}
                    disabled={isDuplicate}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors flex items-center justify-between gap-2
                      ${selectedJobId === job.job_id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"}
                      ${isDuplicate ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-2">{job.title}</div>
                      {job.is_active === false && (
                        <div className="text-xs text-gray-500 mt-0.5">Вакансия неактивна</div>
                      )}
                    </div>
                    {isDuplicate && (
                      <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
                        Уже есть предложение
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Сообщение работодателя */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сообщение соискателю
            </label>
            <textarea
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (e.target.value.length <= 5000) {
                  setMessageError(null);
                }
              }}
              rows={4}
              maxLength={5000}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[96px]"
              placeholder="Расскажите кандидату, почему вы его пригласили и как лучше с вами связаться."
            />
            <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
              <span>Это сообщение попадёт в первое сообщение в чат и в письмо соискателю.</span>
              <span>{messageText.length}/5000</span>
            </div>
            {messageError && (
              <div className="mt-1 text-xs text-red-600">{messageError}</div>
            )}
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600">{error}</div>
          )}

          {successMessage && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="text-sm text-green-600">{successMessage}</div>
              {chatRoomId && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.href = `/chat/${chatRoomId}`;
                    }
                  }}
                  className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <span>Перейти в чат</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedJobId || isSubmitting || jobs.length === 0 || !!successMessage || duplicateForJobIds.has(selectedJobId || 0)}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
            )}
            <span>Отправить приглашение</span>
          </button>
        </div>
      </div>
    </div>
  );
}
