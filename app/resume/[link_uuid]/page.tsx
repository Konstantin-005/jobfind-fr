/**
 * @file: app/resume/[link_uuid]/page.tsx
 * @description: Публичная страница просмотра резюме по UUID-ссылке
 * @dependencies: API_ENDPOINTS.resumes.byLink, apiRequest, Resume types
 * @created: 2025-12-09
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_ENDPOINTS } from "../../config/api";
import { apiRequest } from "../../utils/api";
import type { Resume, SearchResumesResponse } from "../../types/resume";

const pluralize = (num: number, one: string, two: string, five: string) => {
  let n = Math.abs(num);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
};

const getAge = (birthDate?: string) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
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

export default function ResumePublicPage() {
  const params = useParams();
  const linkUuid = Array.isArray(params?.link_uuid)
    ? params.link_uuid[0]
    : (params?.link_uuid as string | undefined);

  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!linkUuid) return;

    const fetchResume = async () => {
      setIsLoading(true);
      setError(null);

      const endpoint = API_ENDPOINTS.resumes.byLink(linkUuid);
      const response = await apiRequest<SearchResumesResponse>(endpoint, {
        method: "GET",
      });

      if (response.error) {
        if (response.status === 404) {
          setError("Резюме не найдено или ссылка больше не активна.");
        } else {
          setError(response.error);
        }
        setResume(null);
      } else if (
        response.data &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        setResume(response.data.data[0]);
      } else {
        setError("Резюме не найдено.");
        setResume(null);
      }

      setIsLoading(false);
    };

    fetchResume();
  }, [linkUuid]);

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

  if (error || !resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6 max-w-lg w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Резюме недоступно</h1>
          <p className="text-gray-600 mb-4">{error || "Резюме не найдено или было удалено."}</p>
        </div>
      </div>
    );
  }

  const age = getAge(resume.job_seeker_profile.birth_date);
  const statusInfo = getJobSearchStatusLabel(resume.job_seeker_profile.job_search_status);
  const updateLabel = getUpdateDateLabel(resume.updated_at);
  const fullName = `${resume.job_seeker_profile.last_name} ${resume.job_seeker_profile.first_name}${
    resume.job_seeker_profile.middle_name ? ` ${resume.job_seeker_profile.middle_name}` : ""
  }`;
  const totalExperience = calculateTotalExperience(resume);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Шапка с ФИО и основной информацией */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-5">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-gray-400">
              {resume.photo_url ? (
                <img
                  src={`/uploads/photo/${resume.photo_url}`}
                  alt="Фото кандидата"
                  className="w-full h-full object-cover"
                />
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
                  {fullName}
                </div>
                <div className="text-sm text-gray-600 space-x-1">
                  {resume.job_seeker_profile.gender === "male" && "Мужчина"}
                  {resume.job_seeker_profile.gender === "female" && "Женщина"}
                  {age && (
                    <span>
                      , {age} {pluralize(age, "год", "года", "лет")}
                    </span>
                  )}
                  {resume.job_seeker_profile.birth_date && (
                    <span className="text-gray-500">
                      {", "}
                      {new Date(
                        resume.job_seeker_profile.birth_date,
                      ).toLocaleDateString("ru-RU")}
                    </span>
                  )}
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
              </div>

              {/* Горизонтальный блок кнопок действий */}
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
        </div>

        {/* Основной контент резюме */}
        <div className="space-y-8">
          {/* Заголовок резюме и зарплата */}
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{resume.title}</h1>
              {resume.profession_name && (
                <div className="text-sm text-gray-600">
                  Специализация: {resume.profession_name}
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
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Опыт работы: {totalExperience}
            </h2>

            <div className="space-y-6">
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
                const periodStart = `${exp.start_month
                  .toString()
                  .padStart(2, "0")} ${exp.start_year}`;
                const periodEnd = exp.is_current
                  ? "по настоящее время"
                  : exp.end_month && exp.end_year
                  ? `${exp.end_month.toString().padStart(2, "0")} ${exp.end_year}`
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

                return (
                  <div key={index} className="flex gap-6">
                    <div className="w-40 text-sm text-gray-500 flex-shrink-0">
                      <div>{periodStart}</div>
                      {periodEnd && <div className="mt-1">{periodEnd}</div>}
                      <div className="mt-1 text-xs text-gray-400">{durationLabel}</div>
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-gray-900">{exp.company_name}</div>
                      <div className="text-gray-600 mb-1">{exp.position}</div>
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
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Навыки</h2>
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
            </section>
          )}

          {/* Языки */}
          {resume.job_seeker_profile.languages &&
            resume.job_seeker_profile.languages.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Языки</h2>
                <div className="text-sm text-gray-800 space-y-1">
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
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Обо мне</h2>
              <div
                className="text-sm text-gray-800 space-y-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: resume.professional_summary }}
              />
            </section>
          )}

          {/* Образование */}
          {(resume.educations && resume.educations.length > 0) || resume.education_type ? (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Образование</h2>
              {resume.education_type && (
                <div className="text-sm text-gray-700 mb-2">
                  Уровень: {resume.education_type.name}
                </div>
              )}
              <div className="space-y-3 text-sm text-gray-800">
                {resume.educations?.map((edu, index) => (
                  <div key={index}>
                    <div className="font-semibold">{edu.institution_name}</div>
                    {edu.specialization_name && (
                      <div className="text-gray-600">{edu.specialization_name}</div>
                    )}
                    <div className="text-gray-500 text-xs mt-0.5">
                      Год окончания: {edu.end_year}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

        </div>
      </div>
    </div>
  );
}
