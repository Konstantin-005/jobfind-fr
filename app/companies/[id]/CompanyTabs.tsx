/**
 * @file: CompanyTabs.tsx
 * @description: Клиентский компонент вкладок «Вакансии» и «Инфо» для публичной карточки компании.
 * @dependencies: app/types/company, app/config/work_formats_202505222228.json
 * @created: 2026-01-07
 */

"use client";

import { useState } from 'react';
import Link from 'next/link';
import workFormatsConfig from '../../config/work_formats_202505222228.json';
import { PublicCompanyDetail, CompanyJobListItem } from '../../types/company';

const workFormatsMap: Record<number, string> = (workFormatsConfig as any)?.work_formats?.reduce((acc: Record<number, string>, wf: any) => {
  if (wf && typeof wf.work_format_id === 'number' && typeof wf.name === 'string') {
    acc[wf.work_format_id] = wf.name;
  }
  return acc;
}, {}) || {};

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
  return (ids || [])
    .map(id => workFormatsMap[id])
    .filter(Boolean);
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
  if (primary && primary.city) return primary.city;
  if (primary && primary.city_name_prepositional) return primary.city_name_prepositional;
  return '';
}

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

export function CompanyTabs({ company }: { company: PublicCompanyDetail }) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'info'>('jobs');

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200 px-4 pt-2">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'jobs'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Вакансии
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Инфо
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'jobs' ? (
        <CompanyJobsTab jobs={company.jobs} />
      ) : (
        <CompanyInfoTab company={company} />
      )}
    </div>
  );
}

function CompanyJobsTab({ jobs }: { jobs: CompanyJobListItem[] }) {
  if (!jobs || jobs.length === 0) {
    return <div className="text-gray-500">У компании пока нет активных вакансий</div>;
  }

  return (
    <div className="grid gap-6">
      {jobs.map(job => {
        const salary = formatSalary(job);
        const salaryDetails = getSalaryDetails(job);
        const workFormats = getWorkFormatLabels(job.work_format_ids);
        const primary = getPrimaryAddress(job);
        const city = resolveCity(job);
        const addr = primary?.address;
        const locationLine = [city, addr].filter(Boolean).join(', ');

        return (
          <div
            key={job.job_id}
            className="bg-white rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex-1 flex flex-col gap-2">
              <h2 className="text-xl font-semibold">
                <Link href={`/vacancy/${job.job_id}`} className="text-[#2B81B0] hover:underline">
                  {job.title}
                </Link>
              </h2>

              {(job.salary_min || job.salary_max) && (
                <div className="text-lg font-semibold text-gray-800">
                  {salary}{' '}
                  {job.salary_currency === 'RUB' ? '₽' : ''}
                  {salaryDetails && (
                    <span className="text-gray-600 font-normal"> ({salaryDetails})</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-1">
                {getExperienceLabel(job.work_experience) && (
                  <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm max-w-max">
                    {getExperienceLabel(job.work_experience)}
                  </span>
                )}
                {workFormats.map(name => (
                  <span
                    key={name}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>

              {job.company_name && (
                <div className="text-gray-700 mt-1">{job.company_name}</div>
              )}

              {locationLine && (
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
                  <span>{locationLine}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompanyInfoTab({ company }: { company: PublicCompanyDetail }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      {company.description && (
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Описание</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{company.description}</p>
        </div>
      )}

      {company.website_url && (
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Сайт</h2>
          <a
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {company.website_url}
          </a>
        </div>
      )}

      {company.industries && company.industries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Отрасли</h2>
          <div className="flex flex-wrap gap-2">
            {company.industries.map(ind => (
              <span
                key={ind.industry_id}
                className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
              >
                {ind.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {(company.location?.region || company.location?.city) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Локация</h2>
          <div className="text-sm text-gray-700">
            {[company.location?.region?.name, company.location?.city?.name].filter(Boolean).join(', ')}
          </div>
        </div>
      )}

      {(company.company_type || company.company_size || company.founded_year) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          {company.company_type && (
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Тип компании</div>
              <div>{company.company_type}</div>
            </div>
          )}
          {company.company_size && (
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Размер</div>
              <div>{company.company_size}</div>
            </div>
          )}
          {company.founded_year && (
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Год основания</div>
              <div>{company.founded_year}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
