'use client';

import Link from 'next/link';
import { useUser } from './useUser';
import { useEffect, useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';

export default function Header() {
  const { role, logout } = useUser();
  const { totalUnread, openChat } = useChat();
  const [isClient, setIsClient] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Закрытие dropdown при клике вне меню
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (dropdownOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, mobileMenuOpen]);

  if (!isClient) return null;

  return (
    <header className="w-full sticky top-0 left-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Основная навигация */}
        <div className="flex items-center justify-between py-3 px-4 md:px-8">
          {/* Логотип и город */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-white font-bold text-xl">J</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">E77</span>
                <p className="text-xs text-gray-500 -mt-1">Работа мечты</p>
              </div>
            </Link>
          </div>

          {/* Навигация для разных ролей */}
          <nav className="hidden lg:flex items-center gap-1">
            {role === 'guest' && (
              <>
                <Link href="/companies" className="relative px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg">
                  Компании
                </Link>
                <Link href="/vacancy" className="relative px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg">
                  Вакансии
                </Link>
              </>
            )}
            {role === 'job_seeker' && (
              <>
                <Link href="/vacancy" className="relative px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg">
                  Вакансии
                </Link>
                <Link href="/companies" className="relative px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg">
                  Компании
                </Link>
                <Link href="/user/resume" className="relative px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg">
                  Мои резюме
                </Link>
                <Link href="/user/my-applications" className="relative px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg">
                  Мои отклики
                </Link>
              </>
            )}
            {role === 'employer' && (
              <>
                <Link href="/resume" className="relative px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg">
                  Поиск резюме
                </Link>
                <Link href="/employer/vacancies" className="relative px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg">
                  Мои вакансии
                </Link>
              </>
            )}
          </nav>

          {/* Кнопки действий */}
          <div className="flex items-center gap-3">
            {role === 'guest' && (
              <>
                <Link href="/register" className="hidden sm:block bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md">
                  Создать резюме
                </Link>
                <Link href="/login" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md">
                  Войти
                </Link>
              </>
            )}

            {(role === 'job_seeker' || role === 'employer') && (
              <>
                <Link
                  href="/chat"
                  className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Чаты"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white box-content">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 shadow-sm"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-semibold">U</span>
                  </div>
                  <span className="hidden sm:block text-gray-700">Кабинет</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-fade-in">
                    <div className="py-3">
                      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                        <p className="text-sm font-semibold text-gray-900">Личный кабинет</p>
                        <p className="text-xs text-gray-500">Управление аккаунтом</p>
                      </div>

                      {role === 'employer' && (
                        <>
                          <Link
                            href="/employer/mycompany"
                            className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Моя компания</p>
                                <p className="text-xs text-gray-500">Управление профилем</p>
                              </div>
                            </div>
                          </Link>
                          <Link
                            href="/employer/vacancies"
                            className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Вакансии</p>
                                <p className="text-xs text-gray-500">Управление вакансиями</p>
                              </div>
                            </div>
                          </Link>
                        </>
                      )}

                      {role === 'job_seeker' && (
                        <>
                          <Link
                            href="/profile"
                            className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Мой профиль</p>
                                <p className="text-xs text-gray-500">Личная информация</p>
                              </div>
                            </div>
                          </Link>
                          <Link
                            href="/user/resume"
                            className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Резюме</p>
                                <p className="text-xs text-gray-500">Управление резюме</p>
                              </div>
                            </div>
                          </Link>
                        </>
                      )}

                      <Link
                        href="/settings"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Настройки</p>
                            <p className="text-xs text-gray-500">Параметры аккаунта</p>
                          </div>
                        </div>
                      </Link>

                      <button
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Выйти</p>
                            <p className="text-xs text-gray-500">Завершить сессию</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            )}

            {/* Мобильное меню */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-3" ref={mobileMenuRef}>
              {role === 'guest' && (
                <>
                  <Link href="/companies" className="block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Компании
                  </Link>
                  <Link href="/vacancy" className="block text-blue-600 text-sm font-semibold py-2 px-3 bg-blue-50 rounded-lg">
                    Вакансии
                  </Link>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Link href="/register" className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition-all duration-200">
                      Создать резюме
                    </Link>
                    <Link href="/login" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition-all duration-200">
                      Войти
                    </Link>
                  </div>
                </>
              )}

              {role === 'job_seeker' && (
                <>
                  <Link href="/vacancy" className="block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Вакансии
                  </Link>
                  <Link href="/companies" className="block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Компании
                  </Link>
                  <Link
                    href="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Чаты {totalUnread > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnread}</span>}
                  </Link>
                  <Link href="/user/resume" className="block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Мои резюме
                  </Link>
                  <Link href="/user/my-applications" className="block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Мои отклики
                  </Link>
                </>
              )}

              {role === 'employer' && (
                <>
                  <Link href="/resume" className="block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Поиск резюме
                  </Link>
                  <Link href="/employer/vacancies" className="block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Мои вакансии
                  </Link>
                  <Link
                    href="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left block text-gray-700 hover:text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Чаты {totalUnread > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnread}</span>}
                  </Link>
                  <Link href="/employer/applications" className="block text-blue-600 text-sm font-semibold py-2 px-3 bg-blue-50 rounded-lg">
                    Отклики
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 