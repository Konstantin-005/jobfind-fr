/**
 * @file: page.tsx
 * @description: Обёртка страницы поиска резюме, рендерящая клиентский ResumeSearchPageClient через Suspense
 * @dependencies: app/resume/ResumeSearchPageClient
 * @created: 2025-12-27
 */

import { Suspense } from 'react'
import ResumeSearchPageClient from './ResumeSearchPageClient'

export default function ResumeSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>}>
      <ResumeSearchPageClient />
    </Suspense>
  )
}
