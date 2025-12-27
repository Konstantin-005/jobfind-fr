'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authApi } from '../../utils/api';

export default function VerifyEmailRegisterClient() {
  const searchParams = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [newEmail, setNewEmail] = useState('');
  const [showChangeEmail, setShowChangeEmail] = useState(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

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

  const startCooldown = () => {
    setCooldownSeconds(120);
  };

  const handleResend = async () => {
    if (!email) {
      setStatus('error');
      setMessage('Email не указан. Вернитесь на страницу регистрации и попробуйте снова.');
      return;
    }
    if (cooldownSeconds > 0) return;

    setStatus('loading');
    setMessage('');
    const response = await authApi.resendVerification({ email });
    if (response.error) {
      setStatus('error');
      setMessage(mapResendError(response.error, response.status));
      if (response.status === 429) startCooldown();
      return;
    }

    if (response.data?.message?.toLowerCase().includes('уже подтверж')) {
      setStatus('success');
      setMessage('Email уже подтверждён. Попробуйте войти.');
      return;
    }

    setStatus('success');
    setMessage('Письмо подтверждения отправлено. Проверьте почту и папку «Спам».');
    startCooldown();
  };

  const handleChangeEmailAndResend = async () => {
    if (!email) {
      setStatus('error');
      setMessage('Email не указан. Вернитесь на страницу регистрации и попробуйте снова.');
      return;
    }
    if (!newEmail) {
      setStatus('error');
      setMessage('Введите новый email.');
      return;
    }
    if (cooldownSeconds > 0) return;

    setStatus('loading');
    setMessage('');
    const response = await authApi.resendVerification({ email, new_email: newEmail });
    if (response.error) {
      setStatus('error');
      setMessage(mapResendError(response.error, response.status));
      if (response.status === 429) startCooldown();
      return;
    }

    setEmail(newEmail);
    setNewEmail('');
    setShowChangeEmail(false);

    setStatus('success');
    setMessage('Письмо подтверждения отправлено на новый email. Проверьте почту и папку «Спам».');
    startCooldown();
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Подтвердите ваш email
        </h2>

        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-700">Мы отправили письмо с подтверждением на адрес:</p>
                {email && (
                  <p className="mt-2 text-sm font-semibold text-gray-900">{email}</p>
                )}
                <p className="mt-4 text-sm text-gray-700">
                  Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме для активации аккаунта.
                </p>

                <div className="mt-6 rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-blue-700">
                        Не получили письмо? Проверьте папку "Спам" или подождите несколько минут.
                      </p>
                    </div>
                  </div>
                </div>

                {(status === 'success' || status === 'error') && message && (
                  <div
                    className={`mt-6 rounded-md p-4 ${
                      status === 'success' ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <p className={`text-sm ${status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={status === 'loading' || cooldownSeconds > 0}
                    className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cooldownSeconds > 0
                      ? `Отправить ещё раз (${cooldownSeconds}с)`
                      : status === 'loading'
                      ? 'Отправляем...'
                      : 'Отправить письмо ещё раз'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChangeEmail((v) => !v)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                  >
                    Изменить email и отправить письмо
                  </button>
                </div>

                {showChangeEmail && (
                  <div className="mt-4 rounded-md border border-gray-200 p-4">
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
                      disabled={status === 'loading' || cooldownSeconds > 0}
                      className="mt-3 flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cooldownSeconds > 0
                        ? `Подождите ${cooldownSeconds}с`
                        : status === 'loading'
                        ? 'Отправляем...'
                        : 'Сохранить и отправить письмо'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
            Вернуться на страницу входа
          </Link>
        </div>
      </div>
    </div>
  );
}
