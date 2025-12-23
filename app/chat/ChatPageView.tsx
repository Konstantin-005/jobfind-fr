/**
 * @file: ChatPageView.tsx
 * @description: Клиентский контейнер страницы чата, синхронизирующий выбор комнаты с URL /chat/[id]
 * @dependencies: app/components/ChatInterface, next/navigation, app/components/useUser
 * @created: 2025-12-22
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '../components/ChatInterface';
import { useUser } from '../components/useUser';
import Link from 'next/link';

interface ChatPageViewProps {
  initialRoomId?: number;
}

export default function ChatPageView({ initialRoomId }: ChatPageViewProps) {
  const { role, isLoading } = useUser();
  const router = useRouter();

  const handleRoomSelect = (roomId: number | null) => {
    if (roomId) {
      router.replace(`/chat/${roomId}`);
    } else {
      router.replace('/chat');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 pt-24 pb-4 flex justify-center items-center">
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
            <Link
              href="/register"
              className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-[60px] bg-gray-50 flex flex-col overflow-hidden">
      <div className="max-w-[1920px] w-full mx-auto px-4 flex-1 flex flex-col min-h-0">
        <h1 className="text-2xl font-bold text-gray-900 py-3 shrink-0">Сообщения</h1>
        <div className="flex-1 min-h-0 pb-4 flex flex-col">
          <ChatInterface initialRoomId={initialRoomId} onRoomSelect={handleRoomSelect} />
        </div>
      </div>
    </div>
  );
}
