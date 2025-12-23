/**
 * @file: app/employer/vacancies/add/page.tsx
 * @description: Страница создания вакансии работодателем.
 * @dependencies: app/employer/vacancies/_components/VacancyForm
 * @created: 2025-12-13
 */

import type { Metadata } from 'next';

import VacancyForm from '../_components/VacancyForm';

export const metadata: Metadata = {
  title: 'Создание вакансии | E77.top',
  description: 'Создание новой вакансии: заполнение условий, требований, контактов и параметров публикации.',
};

export default function EmployerVacancyAddPage() {
  return <VacancyForm mode="create" />;
}
