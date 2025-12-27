'use client';

import { useEffect, useState } from 'react';
import Header from './components/Header';
import { ChatProvider } from './context/ChatContext';
import ChatFloatingButton from './components/ChatFloatingButton';
import { parseJwt } from './components/useUser';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingToken = localStorage.getItem('token');

    // Если пользователь уже залогинен, авто-токен из ссылки игнорируем
    if (existingToken) {
      return;
    }

    const url = new URL(window.location.href);
    const autoLoginToken = url.searchParams.get('auto_login_token');

    if (!autoLoginToken) {
      return;
    }

    // Пытаемся декодировать токен и проверить срок действия по exp
    let decoded: any = null;
    try {
      decoded = parseJwt(autoLoginToken);
    } catch {
      decoded = null;
    }

    const exp = decoded?.exp;
    const isExpired = typeof exp === 'number' && exp * 1000 < Date.now();

    // В любом случае убираем токен из URL, чтобы не светить его в истории/закладках
    url.searchParams.delete('auto_login_token');
    window.history.replaceState({}, '', url.toString());

    if (!decoded || !exp || isExpired) {
      // Просроченный или некорректный токен не сохраняем, показываем уведомление
      setAutoLoginError('Ссылка для входа из письма устарела или недействительна. Пожалуйста, восстановите доступ к аккаунту.');
      return;
    }

    // Сохраняем валидный токен как обычный auth-токен
    localStorage.setItem('token', autoLoginToken);

    // Сохраняем user_type из payload JWT (если есть)
    if (typeof decoded.user_type === 'string') {
      localStorage.setItem('user_type', decoded.user_type);
    }
  }, []);

  return (
    <ChatProvider>
      <Header />
      {autoLoginError && (
        <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-sm px-4 py-3">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{autoLoginError}</span>
            <a
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
            >
              Восстановить пароль
            </a>
          </div>
        </div>
      )}
      <main className="min-h-screen bg-gray-50">{children}</main>
      <ChatFloatingButton />
    </ChatProvider>
  );
}