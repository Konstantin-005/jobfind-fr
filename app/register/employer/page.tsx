'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../../utils/api';

export default function EmployerRegister() {
  const router = useRouter();
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState('');
  const [phoneDigitsAfter7, setPhoneDigitsAfter7] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ensureCaretAfterPrefix = () => {
    const input = phoneInputRef.current;
    if (!input) return;
    const prefixLength = 2;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start < prefixLength || end < prefixLength) {
      input.setSelectionRange(prefixLength, prefixLength);
    }
  };

  const normalizePhoneAfter7 = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';

    const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
    const after7 = normalized.startsWith('7') ? normalized.slice(1) : normalized;
    return after7.slice(0, 10);
  };

  const formatPhone = (digitsAfter7: string) => {
    const d = digitsAfter7.replace(/\D/g, '').slice(0, 10);

    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 8);
    const e = d.slice(8, 10);

    let result = '+7';
    if (a.length) result += ` ${a}`;
    if (b.length) result += ` ${b}`;
    if (c.length) result += `-${c}`;
    if (e.length) result += `-${e}`;
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneDigits = `7${phoneDigitsAfter7.replace(/\D/g, '')}`;
    if (phoneDigits.length !== 11) {
      setError('Введите номер телефона в формате +7 xxx xxx-xx-xx');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({ 
        email, 
        phone_number: phoneDigits,
        password,
        user_type: 'employer'
      });
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        // НЕ сохраняем токен - пользователь должен сначала подтвердить email
        // Перенаправляем на страницу подтверждения email
        router.push(`/register/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      setError('Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Регистрация работодателя
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
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
            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
              Телефон
            </label>
            <div className="mt-2">
              <input
                ref={phoneInputRef}
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                value={formatPhone(phoneDigitsAfter7)}
                onChange={(e) => setPhoneDigitsAfter7(normalizePhoneAfter7(e.target.value))}
                onFocus={ensureCaretAfterPrefix}
                onClick={ensureCaretAfterPrefix}
                onSelect={ensureCaretAfterPrefix}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowLeft' && e.key !== 'Backspace' && e.key !== 'Home') return;
                  const input = e.currentTarget;
                  const prefixLength = 2;
                  const start = input.selectionStart ?? 0;
                  const end = input.selectionEnd ?? 0;
                  if (start <= prefixLength && end <= prefixLength) {
                    e.preventDefault();
                    input.setSelectionRange(prefixLength, prefixLength);
                  }
                }}
                placeholder="+7 999 123-45-67"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

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
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
} 