/**
 * @file: page.tsx
 * @description: SSR-страница публичного списка компаний `/companies` с первичной загрузкой и клиентской фильтрацией.
 * @dependencies: app/components/CompanyCard, app/utils/api, app/config/api
 * @created: 2026-01-07
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';
import { API_ENDPOINTS } from '../config/api';
import { PublicCompanyListItem } from '../types/company';
import CompaniesClient from './CompaniesClient';

async function fetchInitialData() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000';
  const base = `${proto}://${host}`;

  const industriesUrl = new URL(API_ENDPOINTS.dictionaries.industries, base).toString();
  const companiesUrl = new URL(`${API_ENDPOINTS.dictionaries.companies}?page=1&limit=20`, base).toString();

  const [industriesRes, companiesRes] = await Promise.all([
    fetch(industriesUrl, { cache: 'no-store' }),
    fetch(companiesUrl, { cache: 'no-store' }),
  ]);

  const industries = industriesRes.ok ? await industriesRes.json() : [];
  const companiesData = companiesRes.ok ? await companiesRes.json() : { data: [], page: 1, limit: 20, total_count: 0 };

  const payload = companiesData as any;
  let companies: PublicCompanyListItem[] = [];
  let page = 1;
  let limit = 20;
  let totalCount = 0;

  if (Array.isArray(payload)) {
    companies = payload;
    page = 1;
    limit = payload.length || 20;
    totalCount = payload.length;
  } else if (payload) {
    companies = Array.isArray(payload.data) ? payload.data : [];
    page = typeof payload.page === 'number' ? payload.page : 1;
    limit = typeof payload.limit === 'number' ? payload.limit : 20;
    totalCount = typeof payload.total_count === 'number' ? payload.total_count : companies.length;
  }

  return { industries, companies, meta: { page, limit, total_count: totalCount } };
}

export default async function CompaniesPage() {
  const initial = await fetchInitialData();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Компании</h1>
        <Suspense fallback={<div className="text-gray-500">Загрузка компаний...</div>}>
          <CompaniesClient
            initialIndustries={initial.industries}
            initialCompanies={initial.companies}
            initialMeta={initial.meta}
          />
        </Suspense>
      </div>
    </div>
  );
}
