/**
 * @file: not-found.tsx
 * @description: Публичная страница 404 для компании `/companies/{id}`.
 * @dependencies: next/link
 * @created: 2026-01-07
 */

import Link from 'next/link';

export default function CompanyNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-8 h-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Компания не найдена</h1>
        <p className="text-gray-600 mb-4 text-sm">
          Возможно, компания была удалена или ссылка устарела.
        </p>
        <Link
          href="/companies"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          К списку компаний
        </Link>
      </div>
    </div>
  );
}
