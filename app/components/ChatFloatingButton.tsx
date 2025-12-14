'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useChat } from '../context/ChatContext';
import ChatInterface from './ChatInterface';
import { useUser } from './useUser';

export default function ChatFloatingButton() {
  const { role } = useUser();
  const pathname = usePathname();
  const { isChatOpen, toggleChat, closeChat, totalUnread, initialRoomId } = useChat();

  if (role === 'guest') return null;
  if (pathname === '/chat') return null;

  return (
    <>
      {/* Кнопка */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label="Открыть чат"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* Модальное окно */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:px-6 sm:pb-20 pointer-events-none">
          {/* Overlay для закрытия при клике вне (опционально, можно сделать прозрачным или затемненным) */}
          <div 
            className="fixed inset-0 bg-black/20 pointer-events-auto transition-opacity" 
            onClick={closeChat}
          />
          
          <div className="pointer-events-auto w-full sm:w-[600px] h-[80vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-fade-in-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Чаты</h2>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={closeChat}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
                {/* Используем тот же интерфейс, но стилизуем под модалку (убираем лишние отступы если надо) */}
               <ChatInterface initialRoomId={initialRoomId || undefined} /> 
            </div>
          </div>
        </div>
      )}
    </>
  );
}
