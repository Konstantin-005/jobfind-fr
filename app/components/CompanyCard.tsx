/**
 * @file: CompanyCard.tsx
 * @description: Публичная карточка компании для списка `/companies`.
 * @dependencies: app/types/company, next/link
 * @created: 2026-01-07
 */

'use client';

import Link from 'next/link';
import { PublicCompanyListItem } from '../types/company';

const COMPANY_LOGO_PREFIX = '/uploads/companyLogo/';

function buildCompanyLogoSrc(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
  if (/^(data|blob):/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `${COMPANY_LOGO_PREFIX}${trimmed}`;
}

interface CompanyCardProps {
  company: PublicCompanyListItem;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const logoSrc = buildCompanyLogoSrc(company.logo_url);
  const name = company.brand_name || company.company_name;

  const primaryAddress = Array.isArray(company.addresses) && company.addresses.length > 0
    ? company.addresses[0]
    : undefined;

  const locationLine = primaryAddress
    ? [primaryAddress.city?.name, primaryAddress.address].filter(Boolean).join(', ')
    : undefined;

  const description = company.description?.trim() || '';
  const shortDescription = description.length > 160
    ? `${description.slice(0, 157)}...`
    : description;

  const jobsCount = company.active_jobs_count ?? 0;
  const jobsLabel = (() => {
    const n = jobsCount;
    if (n % 10 === 1 && n % 100 !== 11) return `${n} вакансия`;
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} вакансии`;
    return `${n} вакансий`;
  })();

  return (
    <Link
      href={`/companies/${company.company_id}`}
      className="block bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-150"
    >
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {logoSrc ? (
            <img src={logoSrc} alt={name} className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-gray-400 text-sm font-semibold">LOGO</span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>     
          </div>

          {locationLine && (
            <div className="flex items-center text-gray-600 text-sm gap-1 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-gray-400"
              >
                <path d="M12 2.25c-4.28 0-7.75 3.47-7.75 7.75 0 5.81 7.13 11.22 7.43 11.45.2.15.47.15.67 0 .3-.23 7.43-5.64 7.43-11.45 0-4.28-3.47-7.75-7.75-7.75Zm0 10.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
              </svg>
              <span>{locationLine}</span>
            </div>
          )}

          {shortDescription && (
            <p className="mt-1 text-sm text-gray-700 line-clamp-2">{shortDescription}</p>
          )}

          <div className="mt-2 text-sm font-medium text-blue-700">
            {jobsLabel}
          </div>
        </div>
      </div>
    </Link>
  );
}
