'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../../utils/api';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Токен подтверждения не найден. Пожалуйста, проверьте ссылку из письма.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail({ token });
        
        if (response.error) {
          setStatus('error');
          setMessage(response.error);
        } else if (response.data) {
          setStatus('success');
          setMessage('Email успешно подтверждён! Теперь вы можете войти в систему.');
          
          // Перенаправляем на страницу входа через 3 секунды
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      } catch (err) {
        setStatus('error');
        setMessage('Произошла ошибка при подтверждении email');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Подтверждение email
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-gray-600">Подтверждаем ваш email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Email подтверждён</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{message}</p>
                  <p className="mt-2">Вы будете перенаправлены на страницу входа через 3 секунды...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка подтверждения</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="font-semibold text-blue-600 hover:text-blue-500"
          >
            Вернуться на страницу входа
          </Link>
        </div>
      </div>
    </div>
  );
}
