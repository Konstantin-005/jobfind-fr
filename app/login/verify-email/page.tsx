import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
