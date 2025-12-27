'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authApi } from '../utils/api';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [alert, setAlert] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!token) {
      setAlert({ type: 'error', text: 'Ссылка для сброса пароля недействительна или устарела.' });
      return;
    }

    if (password.length < 6) {
      setAlert({ type: 'error', text: 'Пароль должен содержать минимум 6 символов.' });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({ type: 'error', text: 'Пароли не совпадают.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword({ token, password });

      if (response.error) {
        if (response.status === 400 || response.status === 404) {
          setAlert({ type: 'error', text: 'Ссылка для сброса пароля недействительна или устарела.' });
        } else {
          setAlert({ type: 'error', text: response.error });
        }
        return;
      }

      setAlert({ type: 'success', text: 'Пароль обновлён. Сейчас вы будете перенаправлены на страницу входа.' });
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch {
      setAlert({ type: 'error', text: 'Техническая ошибка. Попробуйте позже.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Новый пароль</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Введите новый пароль для вашего аккаунта.</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {alert?.text && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              alert.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {alert.text}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Пароль
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium leading-6 text-gray-900">
              Подтвердите пароль
            </label>
            <div className="mt-2">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    </div>
  );
}
