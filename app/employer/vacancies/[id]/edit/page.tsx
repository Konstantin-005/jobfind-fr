/**
 * @file: app/employer/vacancies/[id]/edit/page.tsx
 * @description: Страница редактирования вакансии работодателем.
 * @dependencies: app/employer/vacancies/_components/VacancyForm
 * @created: 2025-12-13
 */

'use client';

import { useParams } from 'next/navigation';

import VacancyForm from '../../_components/VacancyForm';

export default function EmployerVacancyEditPage() {
  const params = useParams();
  const rawId = (params as any)?.id;
  const jobId = Number(rawId);

  return <VacancyForm mode="edit" jobId={Number.isFinite(jobId) ? jobId : undefined} />;
}
