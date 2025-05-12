'use client';

import Link from 'next/link';
import { useUser } from './useUser';
import { useEffect, useState, useRef } from 'react';

export default function Header() {
  const { role, logout } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Закрытие dropdown при клике вне меню
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  if (!isClient) return null;

  return (
    <header className="w-full fixed top-0 left-0 z-30 bg-[#2B81B0] shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 md:px-8">
        {/* Left: Город + Навигация для job_seeker */}
        <div className="flex items-center gap-4">
          <Link href="#" className="text-white hover:text-gray-100 underline text-base font-semibold transition">Одинцово</Link>
          {role === 'job_seeker' && (
            <>
              <Link href="/resume" className="text-white hover:text-gray-100 underline text-base font-semibold transition">Мои резюме</Link>
              <Link href="#" className="text-white hover:text-gray-100 underline text-base font-semibold transition">Мои отклики</Link>
            </>
          )}
        </div>
        {/* Center: Навигация для других ролей */}
        {role !== 'job_seeker' && (
          <nav className="hidden md:flex items-center gap-8">
            {role === 'guest' && <>
              <Link href="#" className="text-white text-base font-medium hover:text-gray-100 transition">Соискателям</Link>
              <Link href="#" className="text-white text-base font-semibold underline hover:text-gray-100 transition">Работодателям</Link>
            </>}
            {role === 'employer' && <>
              <Link href="#" className="text-white text-base font-medium hover:text-gray-100 transition">Мои вакансии</Link>
              <Link href="#" className="text-white text-base font-semibold underline hover:text-gray-100 transition">Отклики</Link>
            </>}
          </nav>
        )}
        {/* Right: Кнопки */}
        <div className="flex items-center gap-2 md:gap-3">
          {role === 'guest' && <>
            <Link href="#" className="bg-green-100 text-green-900 px-4 py-1.5 rounded-lg text-sm font-semibold border border-green-300 shadow hover:bg-green-200 transition">Создать резюме</Link>
            <Link href="/login" className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow hover:bg-blue-800 transition">Войти</Link>
          </>}
          {(role === 'job_seeker' || role === 'employer') && <>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((open) => !open)}
                className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow hover:bg-gray-800 transition focus:outline-none"
              >
                Личный кабинет
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in">
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg transition"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Настройки
                  </Link>
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-b-lg transition"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </>}
        </div>
      </div>
    </header>
  );
} 