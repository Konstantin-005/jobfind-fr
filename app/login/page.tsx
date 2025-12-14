'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [mode, setMode] = useState<'login' | 'verify_email'>('login');
  const [newEmail, setNewEmail] = useState('');
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const startCooldown = () => {
    setCooldownSeconds(120);
  };

  const mapResendError = (errorText: string, httpStatus?: number) => {
    if (httpStatus === 429) {
      if (errorText.toLowerCase().includes('недавно')) {
        return 'Письмо уже отправлялось недавно. Попробуйте позже.';
      }
      return 'Слишком много запросов. Попробуйте позже.';
    }

    if (httpStatus === 400) {
      if (errorText.toLowerCase().includes('использ')) {
        return 'Email уже используется. Укажите другой адрес.';
      }
      return errorText;
    }

    if (httpStatus === 404) {
      return 'Пользователь не найден. Проверьте email, который вы указали при регистрации.';
    }

    return errorText || 'Не удалось отправить письмо подтверждения.';
  };

  const handleResend = async () => {
    if (!email) {
      setAlert({ type: 'error', text: 'Введите email.' });
      return;
    }
    if (cooldownSeconds > 0) return;

    setIsLoading(true);
    setAlert(null);
    try {
      const response = await authApi.resendVerification({ email });
      if (response.error) {
        setAlert({ type: 'error', text: mapResendError(response.error, response.status) });
        if (response.status === 429) startCooldown();
        return;
      }

      if (response.data?.message?.toLowerCase().includes('уже подтверж')) {
        setAlert({ type: 'success', text: 'Email уже подтверждён. Попробуйте войти.' });
        return;
      }

      setAlert({ type: 'success', text: 'Письмо подтверждения отправлено. Проверьте почту и папку «Спам».' });
      startCooldown();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmailAndResend = async () => {
    if (!email) {
      setAlert({ type: 'error', text: 'Введите email, который вы указывали при регистрации.' });
      return;
    }
    if (!newEmail) {
      setAlert({ type: 'error', text: 'Введите новый email.' });
      return;
    }
    if (cooldownSeconds > 0) return;

    setIsLoading(true);
    setAlert(null);
    try {
      const response = await authApi.resendVerification({ email, new_email: newEmail });
      if (response.error) {
        setAlert({ type: 'error', text: mapResendError(response.error, response.status) });
        if (response.status === 429) startCooldown();
        return;
      }

      setEmail(newEmail);
      setNewEmail('');
      setShowChangeEmail(false);
      setAlert({ type: 'success', text: 'Письмо подтверждения отправлено на новый email. Проверьте почту и папку «Спам».' });
      startCooldown();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });
      
      if (response.error) {
        if (response.status === 403) {
          setMode('verify_email');
          setAlert({ type: 'error', text: 'Email не подтверждён. Подтвердите email, чтобы войти.' });
        } else if (response.status === 401) {
          setMode('login');
          setAlert({ type: 'error', text: 'Неверный email или пароль.' });
        } else {
          setAlert({ type: 'error', text: response.error });
        }
      } else if (response.data) {
        // Сохраняем токен и user_type в localStorage
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user_id', response.data.user.user_id);
          if (response.data.user.user_type) {
            localStorage.setItem('user_type', response.data.user.user_type);
          }
        }
        window.location.href = '/';
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Произошла ошибка при входе' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {mode === 'login' ? 'Вход в аккаунт' : 'Подтвердите email'}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {alert?.text && (
          <div className={`mb-4 p-3 rounded-md text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {alert.text}
          </div>
        )}

        {mode === 'login' && (
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Пароль
              </label>
              <div className="text-sm">
                <Link href="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-500">
                  Забыли пароль?
                </Link>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
          </form>
        )}

        {mode === 'verify_email' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-700">
              Мы не смогли выполнить вход. Если вы только что зарегистрировались, проверьте почту и подтвердите email.
            </p>

            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Мы отправим письмо подтверждения на указанный email. Если вы ошиблись в адресе, можете заменить его.
              </p>
            </div>

            <div>
              <label htmlFor="email-verify" className="block text-sm font-medium leading-6 text-gray-900">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email-verify"
                  name="email-verify"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading || cooldownSeconds > 0}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldownSeconds > 0 ? `Отправить ещё раз (${cooldownSeconds}с)` : (isLoading ? 'Отправляем...' : 'Отправить письмо ещё раз')}
            </button>

            <button
              type="button"
              onClick={() => setShowChangeEmail((v) => !v)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              Изменить email
            </button>

            {showChangeEmail && (
              <div className="rounded-md border border-gray-200 p-4">
                <label htmlFor="new-email" className="block text-sm font-medium text-gray-900">
                  Новый email
                </label>
                <div className="mt-2">
                  <input
                    id="new-email"
                    name="new-email"
                    type="email"
                    autoComplete="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleChangeEmailAndResend}
                  disabled={isLoading || cooldownSeconds > 0}
                  className="mt-3 flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldownSeconds > 0 ? `Подождите ${cooldownSeconds}с` : (isLoading ? 'Отправляем...' : 'Сохранить и отправить письмо')}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAlert(null);
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              Вернуться к форме входа
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          Нет аккаунта?{' '}
          <Link href="/register" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
} 