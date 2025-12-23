/**
 * @file: app/employer/vacancies/[id]/applications/page.tsx
 * @description: Страница откликов по вакансии для работодателя с фильтрацией по статусам
 * @dependencies: app/config/api.ts
 * @created: 2025-12-05
 */
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const VacancyApplicationsPageClient = dynamic(() => import('./VacancyApplicationsPageClient'), { ssr: false });

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const idNum = Number(params.id);
  const suffix = ' | E77.top';
  if (!Number.isFinite(idNum)) {
    return {
      title: `Отклики по вакансии ${suffix}`,
      description: 'Просмотр откликов по вакансии: статусы кандидатов, массовые действия и фильтрация.',
    };
  }

  return {
    title: `Отклики по вакансии #${idNum} ${suffix}`,
    description: 'Просмотр откликов по вакансии: статусы кандидатов, массовые действия и фильтрация.',
  };
}

export default function VacancyApplicationsPage() {
  return <VacancyApplicationsPageClient />;
}
