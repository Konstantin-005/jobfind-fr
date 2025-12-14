'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authApi } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword({ email });
      
      if (response.error) {
        if (response.status === 400) {
          setError(response.error);
        } else if (response.status === 500) {
          setError('Техническая ошибка. Попробуйте позже.');
        } else {
          setError(response.error);
        }
      } else if (response.data) {
        setSuccess('Если аккаунт существует, мы отправили письмо со ссылкой для сброса пароля. Проверьте почту и папку «Спам».');
      }
    } catch (err) {
      setError('Произошла ошибка при отправке запроса');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Восстановление пароля
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Если аккаунт существует, мы отправим письмо со ссылкой для сброса пароля.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
            {success}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? 'Отправка...' : 'Отправить ссылку'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Если вы не получили письмо, проверьте папку «Спам» или повторите попытку.
        </p>

        <p className="mt-10 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
            Вернуться к входу
          </Link>
        </p>
      </div>
    </div>
  );
} 