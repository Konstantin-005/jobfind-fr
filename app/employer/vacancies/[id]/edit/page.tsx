/**
 * @file: app/employer/vacancies/[id]/edit/page.tsx
 * @description: Страница редактирования вакансии работодателем.
 * @dependencies: app/employer/vacancies/_components/VacancyForm
 * @created: 2025-12-13
 */
import type { Metadata } from 'next';
import EmployerVacancyEditPageClient from './EmployerVacancyEditPageClient';

export const metadata: Metadata = {
  title: 'Редактирование вакансии | E77.top',
  description: 'Редактирование вакансии: условия, требования, контакты и дополнительные параметры публикации.',
};

export default function EmployerVacancyEditPage() {
  return <EmployerVacancyEditPageClient />;
}
