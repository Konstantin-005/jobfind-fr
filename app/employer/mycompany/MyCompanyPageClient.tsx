/**
 * @file: MyCompanyPageClient.tsx
 * @description: Клиентский компонент страницы "Моя компания". Обертка над CompanyForm в режиме редактирования.
 * @dependencies: CompanyForm
 * @created: 2025-11-16
 * @updated: 2025-12-14
 */
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CompanyForm from '../components/CompanyForm';

export default function MyCompanyPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAuth = () => {
        const userType = localStorage.getItem('user_type');
        const token = localStorage.getItem('token');

        if (!token || userType !== 'employer') {
          const returnUrl = searchParams.get('from') || '/employer/mycompany';
          router.push(`/login?from=${encodeURIComponent(returnUrl)}`);
          return;
        }
        
        setAuthorized(true);
        setLoading(false);
    };

    checkAuth();
  }, [router, searchParams]);

  if (loading) {
      return <div className="p-8 text-center text-gray-500">Проверка доступа...</div>;
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <CompanyForm mode="edit" />
      </div>
    </div>
  );
}
