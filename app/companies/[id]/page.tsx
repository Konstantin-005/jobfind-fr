/**
 * @file: page.tsx
 * @description: SSR-страница публичной карточки компании `/companies/{id}` с вкладками «Вакансии» и «Инфо».
 * @dependencies: app/utils/api, app/config/api, app/types/company
 * @created: 2026-01-07
 */

import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { API_ENDPOINTS } from '../../config/api';
import { PublicCompanyDetail, CompanyJobListItem } from '../../types/company';

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

const salaryPeriodOptions = [
  { label: 'в месяц', value: 'month' },
  { label: 'в час', value: 'hour' },
  { label: 'за смену', value: 'shift' },
  { label: 'за вахту', value: 'vahta' },
  { label: 'за проект', value: 'project' },
];

const salaryTypeOptions = [
  { label: 'на руки', value: 'after_tax' },
  { label: 'до вычета налогов', value: 'before_tax' },
];

const workExperienceOptions = [
  { label: 'Без опыта', value: '0' },
  { label: 'Опыт до 1 года', value: '0_1' },
  { label: 'Опыт 1-3 года', value: '1_3' },
  { label: 'Опыт 3-5 лет', value: '3_5' },
  { label: 'Опыт от 5 лет', value: 'more_5' },
];

function formatSalary(job: CompanyJobListItem) {
  const min = job.salary_min;
  const max = job.salary_max;
  if (min && max) return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')}`;
  if (min) return `от ${min.toLocaleString('ru-RU')}`;
  if (max) return `до ${max.toLocaleString('ru-RU')}`;
  return '';
}

function getSalaryDetails(job: CompanyJobListItem) {
  const period = salaryPeriodOptions.find(p => p.value === job.salary_period)?.label;
  const sType = salaryTypeOptions.find(t => t.value === job.salary_type)?.label;
  return [period, sType].filter(Boolean).join(', ');
}

function getWorkFormatLabels(ids?: number[]) {
  // Для публичного списка берём только основные форматы (офис/удалёнка/гибрид)
  const allowedIds = new Set<number>([1, 2, 4]);
  return (ids || []).filter(id => allowedIds.has(id));
}

function getExperienceLabel(value?: string) {
  return workExperienceOptions.find(o => o.value === value)?.label;
}

function getPrimaryAddress(job: CompanyJobListItem) {
  if (Array.isArray(job.addresses) && job.addresses.length > 0) {
    return job.addresses[0];
  }
  return undefined;
}

function resolveCity(job: CompanyJobListItem) {
  const primary = getPrimaryAddress(job);
  if (primary?.city) return primary.city;
  if (primary?.city_name_prepositional) return primary.city_name_prepositional;
  return '';
}

async function fetchCompany(id: number): Promise<PublicCompanyDetail> {
  const h = headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:4000';
  const base = `${proto}://${host}`;
  const absUrl = new URL(API_ENDPOINTS.dictionaries.companyById(id), base).toString();

  const res = await fetch(absUrl, { cache: 'no-store' });
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error('Failed to load company');
  }
  return res.json();
}

interface CompanyPageProps {
  params: { id: string };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) {
    notFound();
  }

  let company: PublicCompanyDetail | null = null;
  let loadError = false;

  try {
    company = await fetchCompany(id);
  } catch (error) {
    console.error('[CompanyPage] company load failed', error);
    loadError = true;
  }

  if (loadError || !company) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 w-full">
            <h1 className="text-2xl font-bold mb-3">Компания недоступна</h1>
            <p className="text-gray-600 text-sm md:text-base">
              Возможно, компания временно недоступна или возникла ошибка при загрузке данных. Попробуйте обновить страницу
              немного позже.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const logoSrc = buildCompanyLogoSrc(company.logo_url);
  const name = company.brand_name || company.company_name;

  const regionName = company.location?.region?.name;
  const cityName = company.location?.city?.name;
  const locationLine = [regionName, cityName].filter(Boolean).join(', ');

  const fullDescription = company.description || '';
  const shortDescription = fullDescription.slice(0, 300);
  const hasMoreDescription = fullDescription.length > 300;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoSrc ? (
              <img src={logoSrc} alt={name} className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-sm font-semibold">LOGO</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            {locationLine && (
              <div className="text-gray-600 text-sm">{locationLine}</div>
            )}
            {company.website_url && (
              <a
                href={company.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {company.website_url}
              </a>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {company.company_type && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                  {company.company_type}
                </span>
              )}
              {company.is_it_company && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                  IT-компания
                </span>
              )}
            </div>

            {fullDescription && (
              <div className="mt-3 text-sm text-gray-700">
                <p>
                  {hasMoreDescription ? `${shortDescription}...` : fullDescription}
                </p>
                {hasMoreDescription && (
                  <details className="mt-1">
                    <summary className="text-blue-600 cursor-pointer select-none">Показать полное описание</summary>
                    <p className="mt-1 whitespace-pre-line">{fullDescription}</p>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>

        {Array.isArray(company.jobs) && company.jobs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Вакансии компании</h2>
            <div className="grid gap-4">
              {company.jobs.map((job: CompanyJobListItem) => {
                const salary = formatSalary(job);
                const salaryDetails = getSalaryDetails(job);
                const primary = getPrimaryAddress(job);
                const city = resolveCity(job);
                const addr = primary?.address;
                const location = [city, addr].filter(Boolean).join(', ');
                const workFormats = getWorkFormatLabels(job.work_format_ids);

                return (
                  <div
                    key={job.job_id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-2"
                  >
                    <h3 className="text-lg font-semibold">
                      <Link href={`/vacancy/${job.job_id}`} className="text-blue-700 hover:underline">
                        {job.title}
                      </Link>
                    </h3>

                    {(job.salary_min || job.salary_max) && (
                      <div className="text-base font-semibold text-gray-900">
                        {salary}{' '}
                        {job.salary_currency === 'RUB' ? '₽' : ''}
                        {salaryDetails && (
                          <span className="text-gray-600 font-normal"> ({salaryDetails})</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-1">
                      {getExperienceLabel(job.work_experience) && (
                        <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs md:text-sm max-w-max">
                          {getExperienceLabel(job.work_experience)}
                        </span>
                      )}
                      {workFormats.map(id => (
                        <span
                          key={id}
                          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs md:text-sm"
                        >
                          {id}
                        </span>
                      ))}
                    </div>

                    {location && (
                      <div className="mt-1 text-gray-600 text-sm flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-gray-500"
                          aria-hidden="true"
                        >
                          <path d="M12 2.25c-4.28 0-7.75 3.47-7.75 7.75 0 5.81 7.13 11.22 7.43 11.45.2.15.47.15.67 0 .3-.23 7.43-5.64 7.43-11.45 0-4.28-3.47-7.75-7.75-7.75Zm0 10.25a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                        </svg>
                        <span>{location}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
