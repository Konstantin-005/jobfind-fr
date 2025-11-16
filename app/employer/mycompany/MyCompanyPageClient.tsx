/**
 * @file: MyCompanyPageClient.tsx
 * @description: Клиентский компонент страницы "Моя компания" с проверкой роли и загрузкой профиля работодателя.
 * @dependencies: API_ENDPOINTS, apiRequest, app/employer/types/company
 * @created: 2025-11-16
 */
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_ENDPOINTS } from '../../config/api';
import { CompanyProfile } from '../../types/company';
import { apiRequest } from '../../utils/api';

export default function MyCompanyPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchCompanyProfile = async () => {
      try {
        const userType = localStorage.getItem('user_type');

        if (userType !== 'employer') {
          const returnUrl = searchParams.get('from') || '/';
          window.location.href = `/login?from=${encodeURIComponent(returnUrl)}`;
          return;
        }

        const response = await apiRequest<CompanyProfile>(
          API_ENDPOINTS.companies.profile,
          { method: 'GET' }
        );

        if (response.error) {
          const errorMessage = typeof response.error === 'string' ? response.error : 'Произошла ошибка';
          setError(errorMessage);

          if (errorMessage.includes('401')) {
            router.push('/login');
            return;
          }

          if (response.status === 404) {
            window.location.href = '/employer/addcompany';
            return;
          }
          return;
        }

        const { data } = response;
        if (data) {
          setCompany(data);
        }
      } catch (err) {
        console.error('Error fetching company profile:', err);
        setError('Произошла ошибка при загрузке данных компании');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [router, searchParams]);

  if (isLoading) {
    return <div>Загрузка данных компании...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!company) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Профиль компании не найден</h1>
        <button
          onClick={() => router.push('/employer/addcompany')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Создать профиль компании
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Моя компания</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">{company.company_name}</h2>
        <p className="text-gray-700 mb-2">{company.description || 'Описание не указано'}</p>
        {company.website_url && (
          <p className="text-blue-600 hover:underline">
            <a
              href={company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {company.website_url}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
