'use client';

import React from 'react';
import ChatInterface from '../components/ChatInterface';
import { useUser } from '../components/useUser';
import Link from 'next/link';

export default function ChatPage() {
  const { role, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (role === 'guest') {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
            <p className="text-gray-600 mb-8">Для использования чата необходимо авторизоваться.</p>
            <div className="flex justify-center gap-4">
                <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    Войти
                </Link>
                <Link href="/register" className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition">
                    Регистрация
                </Link>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Сообщения</h1>
        <div className="h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
