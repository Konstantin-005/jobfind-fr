/**
 * @file: app/employer/vacancies/add/page.tsx
 * @description: Страница создания вакансии работодателем.
 * @dependencies: app/employer/vacancies/_components/VacancyForm
 * @created: 2025-12-13
 */

import VacancyForm from '../_components/VacancyForm';

export default function EmployerVacancyAddPage() {
  return <VacancyForm mode="create" />;
}
