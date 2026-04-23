/**
 * @file: CompaniesClient.tsx
 * @description: Клиентская логика фильтрации, поиска и lazy load для списка компаний.
 * @dependencies: app/components/CompanyCard, app/utils/api, next/navigation
 * @created: 2026-01-07
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CompanyCard } from '../components/CompanyCard';
import Pagination from '../components/Pagination';
import { PublicCompanyListItem } from '../types/company';
import { publicCompaniesApi } from '../utils/api';

interface CompaniesClientProps {
  initialIndustries: any[];
  initialCompanies: PublicCompanyListItem[];
  initialMeta: { page: number; limit: number; total_count: number };
}

function normalizeCompaniesResponse(payload: any): {
  items: PublicCompanyListItem[];
  page: number;
  limit: number;
  total: number;
} {
  if (Array.isArray(payload)) {
    const items = payload as PublicCompanyListItem[];
    const total = items.length;
    return { items, page: 1, limit: items.length || 50, total };
  }

  if (payload && typeof payload === 'object') {
    if ('items' in payload) {
      const items = Array.isArray(payload.items) ? (payload.items as PublicCompanyListItem[]) : [];
      const page = typeof payload.page === 'number' ? payload.page : 1;
      const limit = typeof payload.limit === 'number' ? payload.limit : 50;
      const total = typeof payload.total === 'number' ? payload.total : items.length;
      return { items, page, limit, total };
    }

    // обратная совместимость со старым форматом
    const items = Array.isArray(payload.data) ? (payload.data as PublicCompanyListItem[]) : [];
    const page = typeof payload.page === 'number' ? payload.page : 1;
    const limit = typeof payload.limit === 'number' ? payload.limit : 50;
    const total = typeof payload.total_count === 'number' ? payload.total_count : items.length;
    return { items, page, limit, total };
  }

  return { items: [], page: 1, limit: 50, total: 0 };
}

export default function CompaniesClient({ initialIndustries, initialCompanies, initialMeta }: CompaniesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = useState<PublicCompanyListItem[]>(initialCompanies);
  const [page, setPage] = useState(initialMeta.page || 1);
  const [limit] = useState(initialMeta.limit || 50);
  const [totalCount, setTotalCount] = useState(initialMeta.total_count || initialCompanies.length);
  const [queryValue, setQueryValue] = useState(searchParams.get('query') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIndustryIds = useMemo(
    () => searchParams.getAll('industry_id').map(Number).filter(Boolean),
    [searchParams]
  );

  const currentPage = useMemo(() => {
    const urlPage = Number(searchParams.get('page') || '1') || 1;
    return urlPage;
  }, [searchParams]);

  const currentLimit = useMemo(() => {
    const raw = Number(searchParams.get('limit') || '') || 0;
    if (!raw) return limit;
    const clamped = Math.max(1, Math.min(200, raw));
    return clamped;
  }, [searchParams, limit]);

  const totalPages = useMemo(() => {
    const pageSize = currentLimit > 0 ? currentLimit : 50;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount, currentLimit]);

  useEffect(() => {
    const urlQuery = searchParams.get('query') || '';
    setQueryValue(urlQuery);
  }, [searchParams]);

  useEffect(() => {
    const urlQuery = (searchParams.get('query') || '').trim();
    const urlIndustryIds = searchParams.getAll('industry_id').map(Number).filter(Boolean);
    const urlPage = currentPage;

    // если это самая первая загрузка без параметров, оставляем SSR-данные
    const isBase = urlQuery === '' && urlIndustryIds.length === 0 && urlPage === 1;
    if (isBase) return;

    const controller = new AbortController();

    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          query: urlQuery || undefined,
          industry_id: urlIndustryIds,
          page: urlPage,
          limit: currentLimit,
        };
        const res = await publicCompaniesApi.list(params);
        if (controller.signal.aborted) return;
        if (res.error || !res.data) {
          setError(res.error || 'Ошибка загрузки списка компаний');
          setCompanies([]);
          setTotalCount(0);
          setPage(1);
          return;
        }
        const normalized = normalizeCompaniesResponse(res.data as any);
        setCompanies(normalized.items);
        setTotalCount(normalized.total);
        setPage(normalized.page);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError('Ошибка загрузки списка компаний');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCompanies();

    return () => {
      controller.abort();
    };
  }, [searchParams, currentLimit, currentPage]);

  const updateUrl = (params: URLSearchParams) => {
    router.push(`/companies${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const handleIndustryClick = (industryId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    const currentIds = params.getAll('industry_id');
    if (currentIds.includes(String(industryId))) {
      const next = currentIds.filter(id => id !== String(industryId));
      params.delete('industry_id');
      next.forEach(id => params.append('industry_id', id));
    } else {
      params.append('industry_id', String(industryId));
    }

    updateUrl(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (queryValue.trim()) {
      params.set('query', queryValue.trim());
    } else {
      params.delete('query');
    }
    updateUrl(params);
  };

  const industries = Array.isArray(initialIndustries) ? initialIndustries : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 mb-4">
        {industries.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Отрасли</h2>
            <div className="flex flex-wrap gap-2">
              {industries.map((ind: any) => {
                const active = selectedIndustryIds.includes(ind.industry_id);
                return (
                  <button
                    key={ind.industry_id}
                    type="button"
                    onClick={() => handleIndustryClick(ind.industry_id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {ind.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            placeholder="Поиск по названию компании"
            value={queryValue}
            onChange={e => setQueryValue(e.target.value)}
          />
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Найти
          </button>
        </form>
      </div>

      {loading && companies.length === 0 && !error && (
        <div className="text-gray-500">Загрузка компаний...</div>
      )}

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {!loading && !error && companies.length === 0 && (
        <div className="text-gray-500">Компании не найдены</div>
      )}

      {companies.length > 0 && (
        <div className="space-y-3">
          {companies.map(company => (
            <CompanyCard key={company.company_id} company={company} />
          ))}
        </div>
      )}

      {companies.length > 0 && (
        <Pagination currentPage={page || currentPage} totalPages={totalPages} basePath="/companies" />
      )}
    </div>
  );
}
