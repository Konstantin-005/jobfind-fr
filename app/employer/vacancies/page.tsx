/**
 * @file: app/employer/vacancies/page.tsx
 * @description: Страница работодателя со списком вакансий и CRUD (просмотр/добавление/редактирование/удаление). Отображает количество откликов по каждой вакансии через API /api/applications/jobs/{job_id}/counts
 * @dependencies: app/utils/api.ts (jobsApi), app/config/api.ts
 * @created: 2025-10-24
 * @updated: 2025-12-05
 */
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const EmployerVacanciesPageClient = dynamic(() => import('./EmployerVacanciesPageClient'), { ssr: false });

export const metadata: Metadata = {
  title: 'Мои вакансии | E77.top',
  description: 'Список вакансий: управление публикациями, просмотр откликов, создание и редактирование вакансий.',
};

export default function EmployerVacanciesPage() {
  return <EmployerVacanciesPageClient />;
}
