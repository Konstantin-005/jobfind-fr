/**
 * @file: app/resume/[link_uuid]/page.tsx
 * @description: Публичная страница просмотра резюме по UUID-ссылке
 * @dependencies: API_ENDPOINTS.resumes.byLink, apiRequest, Resume types
 * @created: 2025-12-09
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { API_ENDPOINTS } from "../../config/api";
import { apiRequest } from "../../utils/api";
import type {
  Resume,
  ResumeContacts,
  SearchResumesByLinkResponse,
  ResumeByLinkItem,
} from "../../types/resume";
import { useUser } from "../../components/useUser";
import { JobOfferModal } from "../../components/JobOfferModal";

const pluralize = (num: number, one: string, two: string, five: string) => {
  let n = Math.abs(num);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
};

const getAgeFromProfile = (ageYears?: number | null) => {
  if (typeof ageYears !== "number" || Number.isNaN(ageYears) || ageYears <= 0) return null;
  return ageYears;
};

const calculateTotalExperience = (resume: Resume) => {
  if (!resume.work_experiences || resume.work_experiences.length === 0) {
    return "Без опыта";
  }

  let totalMonths = 0;
  resume.work_experiences.forEach((exp) => {
    const startDate = new Date(exp.start_year, exp.start_month - 1);
    const endDate = exp.is_current
      ? new Date()
      : new Date(exp.end_year || exp.start_year, (exp.end_month || exp.start_month) - 1);

    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    totalMonths += months;
  });

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years) parts.push(`${years} ${pluralize(years, "год", "года", "лет")}`);
  if (months) parts.push(`${months} ${pluralize(months, "месяц", "месяца", "месяцев")}`);
  return parts.length > 0 ? parts.join(" ") : "Менее месяца";
};

const getJobSearchStatusLabel = (status: string) => {
  const statuses: Record<string, { label: string; color: string }> = {
    actively_looking: {
      label: "Активно ищет работу",
      color: "bg-green-50 text-green-700",
    },
    considering_offers: {
      label: "Рассматривает предложения",
      color: "bg-blue-50 text-blue-700",
    },
    not_looking: {
      label: "Не ищет работу",
      color: "bg-gray-50 text-gray-700",
    },
  };
  return statuses[status] || { label: status, color: "bg-gray-50 text-gray-700" };
};

const getBusinessTripsLabel = (value?: string | null) => {
  if (!value) return null;
  const map: Record<string, string> = {
    yes: "готов к командировкам",
    no: "не готов к командировкам",
    sometimes: "иногда готов к командировкам",
  };
  return map[value] || value;
};

const getUpdateDateLabel = (dateString: string) => {
  const updateDate = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const updateDay = new Date(updateDate.getFullYear(), updateDate.getMonth(), updateDate.getDate());

  const diffTime = today.getTime() - updateDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Обновлено сегодня";
  if (diffDays === 1) return "Обновлено вчера";
  return `Обновлено ${updateDate.toLocaleDateString("ru-RU")}`;
};

const buildHeaderTitle = (
  contacts: ResumeContacts | null | undefined,
  resume: Resume,
  fullNameHiddenByCandidate?: boolean | null
) => {
  const rawLastName = contacts?.last_name?.trim() || "";
  const rawFirstName = contacts?.first_name?.trim() || "";
  const rawMiddleName = contacts?.middle_name?.trim() || "";
  const hasFullName = !!(rawLastName || rawFirstName || rawMiddleName);

  if (hasFullName) {
    return `${rawLastName} ${rawFirstName}${rawMiddleName ? ` ${rawMiddleName}` : ""}`.trim();
  }
  if (fullNameHiddenByCandidate) return "ФИО скрыто соискателем";
  return "Кандидат";
};

type ResumeFullName = {
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
};

export default function ResumePublicPage() {
  const params = useParams();
  const linkUuid = Array.isArray(params?.link_uuid)
    ? params.link_uuid[0]
    : (params?.link_uuid as string | undefined);

  const { role } = useUser();

  const [resumeItem, setResumeItem] = useState<ResumeByLinkItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [chatRoomIdFromOffer, setChatRoomIdFromOffer] = useState<number | null>(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [fullNameHiddenByCandidate, setFullNameHiddenByCandidate] = useState<boolean | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string>("");
  const [showFloatingOffer, setShowFloatingOffer] = useState(false);
  const offerButtonRef = useRef<HTMLButtonElement | null>(null);
  const [offerButtonEl, setOfferButtonEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!linkUuid) return;

    const fetchResume = async () => {
      setIsLoading(true);
      setError(null);

      const endpoint = API_ENDPOINTS.resumes.byLink(linkUuid);
      const response = await apiRequest<SearchResumesByLinkResponse>(endpoint, {
        method: "GET",
      });

      if (response.error) {
        if (response.status === 404) {
          setError("Резюме не найдено или ссылка больше не активна.");
        } else {
          setError(response.error);
        }
        setResumeItem(null);
      } else if (
        response.data &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        setResumeItem(response.data.data[0]);
      } else {
        setError("Резюме не найдено.");
        setResumeItem(null);
      }

      setIsLoading(false);
    };

    fetchResume();
  }, [linkUuid]);

  const fetchContacts = async () => {
    if (!linkUuid) return;
    setContactsLoading(true);
    setContactsError(null);
    const endpoint = API_ENDPOINTS.resumes.contactsByLink(linkUuid);
    const response = await apiRequest<{ contacts?: ResumeContacts | null; full_name?: ResumeFullName | null }>(
      endpoint,
      {
        method: "POST",
      }
    );

    if (response.error) {
      setContactsError(response.error);
    } else if (response.data) {
      setFullNameHiddenByCandidate(response.data.full_name === null);

      const baseContacts = response.data.contacts || null;
      const nameFields = response.data.full_name || null;
      const contactsWithName: ResumeContacts | null =
        baseContacts || nameFields
          ? { ...(baseContacts || {}), ...(nameFields || {}) }
          : null;

      setResumeItem((prev) =>
        prev
          ? {
              ...prev,
              contacts_opened: true,
              contacts: contactsWithName || {},
            }
          : prev
      );
    } else {
      setContactsError("Не удалось получить контакты");
    }
    setContactsLoading(false);
  };

  useEffect(() => {
    if (resumeItem) {
      setHeaderTitle(buildHeaderTitle(resumeItem.contacts, resumeItem.resume, fullNameHiddenByCandidate));
    }
  }, [resumeItem, fullNameHiddenByCandidate]);

  useEffect(() => {
    const target = offerButtonEl;
    if (!target) {
      setShowFloatingOffer(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingOffer(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [offerButtonEl, resumeItem, role]);

  if (!linkUuid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6 max-w-lg w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Некорректная ссылка</h1>
          <p className="text-gray-600">Проверьте правильность ссылки на резюме.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Загружаем резюме…</p>
        </div>
      </div>
    );
  }

  if (error || !resumeItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6 max-w-lg w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Резюме недоступно</h1>
          <p className="text-gray-600 mb-4">{error || "Резюме не найдено или было удалено."}</p>
        </div>
      </div>
    );
  }

  const resume = resumeItem.resume;
  const contacts = resumeItem.contacts;
  const photoUrl = contacts?.photo_url ? `/uploads/photo/${contacts.photo_url}` : null;

  const age = getAgeFromProfile((resume.job_seeker_profile as any).age_years);
  const statusInfo = getJobSearchStatusLabel(resume.job_seeker_profile.job_search_status);
  const updateLabel = getUpdateDateLabel(resume.updated_at);
  const totalExperience = calculateTotalExperience(resume);

  const contactItems =
    [
      {
        key: "phone",
        value: contacts?.phone
          ? `${contacts.phone}${contacts.phone_comment ? ` (${contacts.phone_comment})` : ""}`
          : null,
        icon: "phone",
      },
      { key: "whatsapp", value: contacts?.whatsapp, icon: "whatsapp" },
      { key: "telegram", value: contacts?.telegram, icon: "telegram" },
      { key: "email", value: contacts?.email, icon: "email" },
      { key: "website_url", value: contacts?.website_url, icon: "website" },
    ].filter((item) => item.value);

  const renderContactIcon = (type: string) => {
    switch (type) {
      case "phone":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.25 4.5c0 8.284 6.716 15 15 15h1.5a1.5 1.5 0 001.5-1.5v-2.1a1.5 1.5 0 00-1.26-1.48l-3.12-.52a1.5 1.5 0 00-1.48.59l-.96 1.28a12 12 0 01-5.34-5.34l1.28-.96a1.5 1.5 0 00.59-1.48l-.52-3.12A1.5 1.5 0 007.85 3H5.75A1.5 1.5 0 004.25 4.5v0z"
            />
          </svg>
        );
      case "email":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7l9 6 9-6"
            />
          </svg>
        );
      case "website":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3a9 9 0 100 18 9 9 0 000-18z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.6 9h16.8M3.6 15h16.8M12 3a21 21 0 010 18M12 3a21 21 0 000 18"
            />
          </svg>
        );
      case "whatsapp":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7.5 20.25l-3 1 1-3A7.5 7.5 0 1112 19.5c-1.08 0-2.1-.21-3.04-.6l-1.46.9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 9.75c0 .69.18 1.36.52 1.96.55 1 1.46 1.9 2.46 2.46.6.34 1.27.52 1.96.52.21 0 .42-.02.63-.05a.75.75 0 00.63-.74v-1.13a.75.75 0 00-.64-.74l-1.1-.18a.75.75 0 00-.67.22l-.34.34a.25.25 0 01-.3.04 4.5 4.5 0 01-1.4-1.4.25.25 0 01.04-.3l.34-.34a.75.75 0 00.22-.67l-.18-1.1a.75.75 0 00-.74-.64H9.8a.75.75 0 00-.74.63c-.03.21-.05.42-.05.63z"
            />
          </svg>
        );
      case "telegram":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.5 3.5L3.5 10.5l5 2 2 6 3.5-3.5 4.5 3.5 2-15z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Шапка с ФИО и основной информацией */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 flex items-start gap-5">
          <div className="flex-shrink-0">
            <div
              className={
                photoUrl
                  ? "w-[130px] h-[130px] rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 bg-white"
                  : "w-[130px] h-[130px] rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 bg-gray-100 text-gray-500"
              }
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Фото кандидата" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-lg font-semibold text-gray-900 mb-1 break-words">
                  {headerTitle}
                </div>
                <div className="text-sm text-gray-600 space-x-1">
                  {resume.job_seeker_profile.gender === "male" && "Мужчина"}
                  {resume.job_seeker_profile.gender === "female" && "Женщина"}
                  <span>
                    {age
                      ? `, ${age} ${pluralize(age, "год", "года", "лет")}`
                      : ", Возраст не указан"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {resume.job_seeker_profile.city_name && (
                    <span>{resume.job_seeker_profile.city_name}</span>
                  )}
                  {getBusinessTripsLabel(resume.business_trips) && (
                    <span className="ml-1 text-gray-500">
                      {" · "}
                      {getBusinessTripsLabel(resume.business_trips)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                  <span>{updateLabel}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-800">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Контакты</div>
                  {contactItems.length > 0 ? (
                    <div className="space-y-1">
                      {contactItems.map((item) => (
                        <div key={item.key} className="flex items-center gap-2">
                          <span className="text-gray-500">{renderContactIcon(item.icon)}</span>
                          <span className="break-all">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : contactsLoading ? (
                    <div className="text-gray-500">Загружаем контакты…</div>
                  ) : contactsError ? (
                    <div className="text-red-600 text-sm">{contactsError}</div>
                  ) : resumeItem.contacts_opened === false ? (
                    <button
                      type="button"
                      onClick={fetchContacts}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Открыть контакты
                    </button>
                  ) : (
                    <div className="text-gray-500">Контакты скрыты соискателем</div>
                  )}

                  {role === "employer" && linkUuid && (
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        ref={(node) => {
                          offerButtonRef.current = node;
                          setOfferButtonEl(node);
                        }}
                        onClick={() => setIsOfferModalOpen(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors"
                      >
                        Предложить вакансию
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-red-500 hover:bg-gray-50 transition-colors"
                          aria-label="Добавить в избранное"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                          aria-label="Скачать резюме"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                          aria-label="Распечатать резюме"
                          onClick={() => window.print()}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 9V4h12v5M6 18h12v2H6zM6 14h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Основной контент резюме */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 pt-6 pb-3 space-y-8">
          {/* Заголовок резюме и зарплата */}
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{resume.title}</h1>
              {resume.profession_name && (
                <div className="text-sm text-gray-600">
                  Профессия: {resume.profession_name}
                </div>
              )}
              <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                {resume.employment_types?.length > 0 && (
                  <div>
                    Занятость: {resume.employment_types.map((e) => e.name).join(", ")}
                  </div>
                )}
                {resume.work_formats?.length > 0 && (
                  <div>
                    Формат работы: {resume.work_formats.map((f) => f.name).join(", ")}
                  </div>
                )}
              </div>
            </div>

            {typeof resume.salary_expectation === "number" && (
              <div className="text-right text-sm text-gray-500">
                <span className="text-xl font-semibold text-gray-900">
                  {resume.salary_expectation.toLocaleString("ru-RU")} ₽
                </span>{" "}
                <span>на руки</span>
              </div>
            )}
          </div>

          {/* Опыт работы */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start">
              <div className="md:col-span-1 text-sm font-medium text-gray-600">Опыт работы</div>
              <div className="md:col-span-3 text-sm font-semibold text-gray-900">{totalExperience}</div>
            </div>
            <div className="space-y-4">
              {(resume.work_experiences ? [...resume.work_experiences] : [])
                .sort((a, b) => {
                  const endA = a.is_current
                    ? new Date()
                    : new Date(a.end_year || a.start_year, (a.end_month || a.start_month) - 1);
                  const endB = b.is_current
                    ? new Date()
                    : new Date(b.end_year || b.start_year, (b.end_month || b.start_month) - 1);
                  return endB.getTime() - endA.getTime();
                })
                .map((exp, index) => {
                  const periodStart = `${exp.start_month.toString().padStart(2, "0")}/${exp.start_year}`;
                  const periodEnd = exp.is_current
                    ? "по настоящее время"
                    : exp.end_month && exp.end_year
                    ? `${exp.end_month.toString().padStart(2, "0")}/${exp.end_year}`
                    : "";

                  const startDate = new Date(exp.start_year, exp.start_month - 1);
                  const endDate = exp.is_current
                    ? new Date()
                    : new Date(exp.end_year || exp.start_year, (exp.end_month || exp.start_month) - 1);
                  const monthsDiff =
                    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (endDate.getMonth() - startDate.getMonth());
                  const years = Math.floor(monthsDiff / 12);
                  const months = monthsDiff % 12;
                  const parts: string[] = [];
                  if (years) parts.push(`${years} ${pluralize(years, "год", "года", "лет")}`);
                  if (months) parts.push(`${months} ${pluralize(months, "месяц", "месяца", "месяцев")}`);
                  const durationLabel = parts.length > 0 ? parts.join(" ") : "Менее месяца";

                  const periodLabel = periodEnd ? `${periodStart} — ${periodEnd}` : periodStart;

                  return (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start">
                      <div className="md:col-span-1 text-sm text-gray-700 space-y-1">
                        <div>{periodLabel}</div>
                        {durationLabel && <div className="text-gray-500">{durationLabel}</div>}
                      </div>
                      <div className="md:col-span-3 text-sm space-y-1">
                        <div className="font-semibold text-gray-900">{exp.company_name}</div>
                        <div className="text-gray-700">{exp.position}</div>
                        {exp.responsibilities && (
                          <div
                            className="text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: exp.responsibilities }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Навыки */}
          {resume.resume_skills && resume.resume_skills.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start">
              <div className="md:col-span-1 text-lg font-semibold text-gray-900">Навыки</div>
              <div className="md:col-span-3">
                <div className="flex flex-wrap gap-2">
                  {resume.resume_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium"
                    >
                      {skill.skill?.name ?? ""}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Языки */}
          {resume.job_seeker_profile.languages &&
            resume.job_seeker_profile.languages.length > 0 && (
              <section className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start">
                <div className="md:col-span-1 text-lg font-semibold text-gray-900">Языки</div>
                <div className="md:col-span-3 text-sm text-gray-800 space-y-1">
                  {resume.job_seeker_profile.languages.map((lang, index) => (
                    <div key={index}>
                      {lang.name} ({lang.proficiency_level})
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Обо мне */}
          {resume.professional_summary && (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start">
              <div className="md:col-span-1 text-lg font-semibold text-gray-900">Обо мне</div>
              <div
                className="md:col-span-3 text-sm text-gray-800 space-y-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: resume.professional_summary }}
              />
            </section>
          )}

          {/* Образование */}
          {(resume.educations && resume.educations.length > 0) || resume.education_type ? (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start">
              <div className="md:col-span-1 text-lg font-semibold text-gray-900">Образование</div>
              <div className="md:col-span-3 text-sm text-gray-800 space-y-3">
                {resume.education_type && (
                  <div className="text-gray-700">Уровень: {resume.education_type.name}</div>
                )}
                {resume.educations?.map((edu, index) => (
                  <div key={index}>
                    <div className="font-semibold">{edu.institution_name}</div>
                    {edu.specialization_name && (
                      <div className="text-gray-600">{edu.specialization_name}</div>
                    )}
                    <div className="text-gray-500 text-xs mt-0.5">Год окончания: {edu.end_year}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {role === "employer" && linkUuid && showFloatingOffer && (
            <div className="sticky bottom-0 z-20 -mx-6">
              <div className="bg-white border-t border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(true)}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors whitespace-nowrap"
                >
                  Предложить вакансию
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-red-500 hover:bg-gray-50 transition-colors"
                    aria-label="Добавить в избранное"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    aria-label="Скачать резюме"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    aria-label="Распечатать резюме"
                    onClick={() => window.print()}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 9V4h12v5M6 18h12v2H6zM6 14h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {role === "employer" && linkUuid && (
        <JobOfferModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          resumeLinkUuid={linkUuid}
          onSuccess={(chatRoomId) => {
            setChatRoomIdFromOffer(chatRoomId ?? null);
          }}
        />
      )}
    </div>
  );
}
