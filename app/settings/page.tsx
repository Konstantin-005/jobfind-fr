/**
 * @file: page.tsx
 * @description: Обёртка страницы настроек аккаунта, рендерящая клиентский SettingsClient через Suspense
 * @dependencies: app/settings/SettingsClient
 * @created: 2025-12-27
 */

import { Suspense } from 'react'
import SettingsClient from './SettingsClient'

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Загрузка...</div>}>
      <SettingsClient />
    </Suspense>
  )
}
 
