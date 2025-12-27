/**
 * @file: page.tsx
 * @description: Обёртка страницы сброса пароля, рендерящая клиентский ResetPasswordClient через Suspense
 * @dependencies: app/reset-password/ResetPasswordClient
 * @created: 2025-12-27
 */

import { Suspense } from 'react'
import ResetPasswordClient from './ResetPasswordClient'

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>}>
      <ResetPasswordClient />
    </Suspense>
  )
}