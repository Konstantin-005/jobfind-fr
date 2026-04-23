/**
 * @file: page.tsx
 * @description: SSR-страница публичного списка компаний `/companies` с первичной загрузкой и клиентской фильтрацией.
 * @dependencies: app/components/CompanyCard, app/utils/api, app/config/api
 * @created: 2026-01-07
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { API_ENDPOINTS } from '../config/api';
import { PublicCompanyListItem } from '../types/company';
import CompaniesClient from './CompaniesClient';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  const pageParam = searchParams?.page;
  const pageValue = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const page = Number(pageValue) || 1;

  const queryParam = searchParams?.query;
  const queryValue = Array.isArray(queryParam) ? queryParam[0] : queryParam;
  const hasQuery = typeof queryValue === 'string' && queryValue.trim() !== '';

  const canonicalUrl = `${origin}/companies`;
  const shouldNoIndex = page > 1 || hasQuery;

  return {
    title: 'Компании — E77.top',
    description: 'Каталог компаний: поиск по названию и фильтрация по отраслям.',
    alternates: {
      canonical: canonicalUrl,
    },
    robots: shouldNoIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
    other: shouldNoIndex
      ? {
          yandex: 'noindex, nofollow',
        }
      : undefined,
  };
}

async function fetchInitialData() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000';
  const base = `${proto}://${host}`;

  const limit = 50;

  const industriesUrl = new URL(API_ENDPOINTS.dictionaries.industries, base).toString();
  const companiesUrl = new URL(`${API_ENDPOINTS.dictionaries.companies}?page=1&limit=${limit}`, base).toString();

  const [industriesRes, companiesRes] = await Promise.all([
    fetch(industriesUrl, { cache: 'no-store' }),
    fetch(companiesUrl, { cache: 'no-store' }),
  ]);

  const industries = industriesRes.ok ? await industriesRes.json() : [];
  const companiesData = companiesRes.ok ? await companiesRes.json() : { items: [], total: 0, page: 1, limit, total_count: 0, data: [] };

  const payload = companiesData as any;
  let companies: PublicCompanyListItem[] = [];
  let page = 1;
  let limitResolved = limit;
  let totalCount = 0;

  if (Array.isArray(payload)) {
    companies = payload;
    page = 1;
    limitResolved = payload.length || limit;
    totalCount = payload.length;
  } else if (payload) {
    if (Array.isArray(payload.items)) {
      companies = payload.items;
      page = typeof payload.page === 'number' ? payload.page : 1;
      limitResolved = typeof payload.limit === 'number' ? payload.limit : limit;
      totalCount = typeof payload.total === 'number' ? payload.total : companies.length;
    } else {
      companies = Array.isArray(payload.data) ? payload.data : [];
      page = typeof payload.page === 'number' ? payload.page : 1;
      limitResolved = typeof payload.limit === 'number' ? payload.limit : limit;
      totalCount = typeof payload.total_count === 'number' ? payload.total_count : companies.length;
    }
  }

  return { industries, companies, meta: { page, limit: limitResolved, total_count: totalCount } };
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
