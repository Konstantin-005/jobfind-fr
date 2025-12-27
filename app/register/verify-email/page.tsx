/**
 * @file: page.tsx
 * @description: Страница с сообщением о необходимости подтверждения email после регистрации
 * @dependencies: Next.js, React
 * @created: 2024-12-01
 */

import { Suspense } from 'react';
import VerifyEmailRegisterClient from './VerifyEmailRegisterClient';

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>}>
      <VerifyEmailRegisterClient />
    </Suspense>
  );
}
