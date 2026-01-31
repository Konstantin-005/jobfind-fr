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
import { PublicCompanyListItem } from '../types/company';
import { publicCompaniesApi } from '../utils/api';

interface CompaniesClientProps {
  initialIndustries: any[];
  initialCompanies: PublicCompanyListItem[];
  initialMeta: { page: number; limit: number; total_count: number };
}

export default function CompaniesClient({ initialIndustries, initialCompanies, initialMeta }: CompaniesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = useState<PublicCompanyListItem[]>(initialCompanies);
  const [page, setPage] = useState(initialMeta.page || 1);
  const [limit, setLimit] = useState(initialMeta.limit || 20);
  const [totalCount, setTotalCount] = useState(initialMeta.total_count || initialCompanies.length);
  const [queryValue, setQueryValue] = useState(searchParams.get('query') || '');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIndustryIds = useMemo(
    () => searchParams.getAll('industry_id').map(Number).filter(Boolean),
    [searchParams]
  );

  const hasMore = companies.length < totalCount;

  useEffect(() => {
    const urlQuery = searchParams.get('query') || '';
    setQueryValue(urlQuery);
  }, [searchParams]);

  useEffect(() => {
    const urlPage = Number(searchParams.get('page') || '1') || 1;
    const hasFiltersOrQuery =
      (searchParams.get('query') || '') !== '' ||
      searchParams.getAll('industry_id').length > 0 ||
      searchParams.getAll('city_id').length > 0 ||
      searchParams.getAll('region_id').length > 0;

    if (!hasFiltersOrQuery && urlPage === 1) return;

    const controller = new AbortController();

    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          query: searchParams.get('query') || undefined,
          industry_id: searchParams.getAll('industry_id').map(Number).filter(Boolean),
          city_id: searchParams.getAll('city_id').map(Number).filter(Boolean),
          region_id: searchParams.getAll('region_id').map(Number).filter(Boolean),
          page: urlPage,
          limit,
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
        const payload = res.data as any;
        let items: PublicCompanyListItem[] = [];
        let total = 0;
        let nextPage = urlPage;

        if (Array.isArray(payload)) {
          items = payload;
          total = payload.length;
        } else if (payload) {
          items = Array.isArray(payload.data) ? payload.data : [];
          total = typeof payload.total_count === 'number' ? payload.total_count : items.length;
          nextPage = typeof payload.page === 'number' ? payload.page : urlPage;
        }

        setCompanies(items);
        setTotalCount(total);
        setPage(nextPage);
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
  }, [searchParams, limit]);

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

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);
    try {
      const params = {
        query: searchParams.get('query') || undefined,
        industry_id: searchParams.getAll('industry_id').map(Number).filter(Boolean),
        city_id: searchParams.getAll('city_id').map(Number).filter(Boolean),
        region_id: searchParams.getAll('region_id').map(Number).filter(Boolean),
        page: nextPage,
        limit,
      };
      const res = await publicCompaniesApi.list(params);
      if (res.error || !res.data) {
        setError(res.error || 'Ошибка загрузки списка компаний');
        return;
      }
      const payload = res.data as any;
      let newItems: PublicCompanyListItem[] = [];
      let nextTotal = totalCount;
      let nextPageResolved = nextPage;

      if (Array.isArray(payload)) {
        newItems = payload;
        nextTotal = totalCount + payload.length;
      } else if (payload) {
        newItems = Array.isArray(payload.data) ? payload.data : [];
        nextTotal = typeof payload.total_count === 'number' ? payload.total_count : totalCount;
        nextPageResolved = typeof payload.page === 'number' ? payload.page : nextPage;
      }

      if (newItems.length === 0) {
        setTotalCount(prev => prev);
        return;
      }

      setCompanies(prev => [...prev, ...newItems]);
      setTotalCount(nextTotal);
      setPage(nextPageResolved);
    } catch (e) {
      setError('Ошибка загрузки списка компаний');
    } finally {
      setLoadingMore(false);
    }
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

      {companies.length > 0 && hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 rounded-full border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Загрузка...' : 'Показать ещё'}
          </button>
        </div>
      )}
    </div>
  );
}
