'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-900 pt-12 pb-6">
      {/* Основные блоки */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Инфо */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Инфо</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-700 hover:text-blue-600 hover:underline transition">
                  О проекте
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-gray-700 hover:text-blue-600 hover:underline transition">
                  Контакты
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-700 hover:text-blue-600 hover:underline transition">
                  Помощь
                </Link>
              </li>
            </ul>
          </div>

          {/* Поиск работы */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Поиск работы</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/companies" className="text-gray-700 hover:text-blue-600 hover:underline transition">
                  Каталог компаний
                </Link>
              </li>
              <li>
                <Link href="/professions" className="text-gray-700 hover:text-blue-600 hover:underline transition">
                  Каталог профессий
                </Link>
              </li>
            </ul>
          </div>

          {/* Работодателям */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Работодателям</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/resume-search" className="text-gray-700 hover:text-blue-600 hover:underline transition">
                  Поиск резюме
                </Link>
              </li>
              <li>
                <Link href="/post-vacancy" className="text-gray-700 hover:text-blue-600 hover:underline transition">
                  Добавить вакансию
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Правовая информация */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="flex flex-col md:flex-row justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-gray-700 hover:text-blue-600 hover:underline transition">
              Политика обработки персональных данных
            </Link>
            <span className="hidden md:inline text-gray-400">•</span>
            <Link href="/terms" className="text-gray-700 hover:text-blue-600 hover:underline transition">
              Пользовательское соглашение
            </Link>
          </div>
        </div>

        {/* Копирайт и соцсети */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              © 2026 E77.top Все права защищены
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 