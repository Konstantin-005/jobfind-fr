'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useUser } from './useUser';
import { chatApi } from '../utils/api';
import {
  ChatRoomSummary,
  ChatMessage,
  ChatServerEnvelope,
  ChatClientOutgoingMessage,
  ChatReadEvent,
  ChatJobContext,
  ChatResumeContext,
} from '../types/chat';

interface ChatInterfaceProps {
  initialRoomId?: number; // Если нужно сразу открыть конкретный чат
}

export default function ChatInterface({ initialRoomId }: ChatInterfaceProps) {
  const { role } = useUser();
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(initialRoomId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Собеседник печатает
  const [isMobile, setIsMobile] = useState(false);
  const [jobContext, setJobContext] = useState<ChatJobContext | undefined>(undefined);
  const [resumeContext, setResumeContext] = useState<ChatResumeContext | undefined>(undefined);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getInitials = (value?: string | null) => {
    if (!value) return '??';
    const parts = value.trim().split(/\s+/).slice(0, 2);
    const letters = parts.map((p) => (p[0] ? p[0].toUpperCase() : '')).join('');
    return letters || '??';
  };

  const COMPANY_LOGO_PREFIX = '/uploads/companyLogo/';
  const PHOTO_PREFIX = '/uploads/photo/';
  const buildCompanyLogoSrc = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
    if (/^(data|blob):/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `${COMPANY_LOGO_PREFIX}${trimmed}`;
  };

  const buildPhotoSrc = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
    if (/^(data|blob):/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `${PHOTO_PREFIX}${trimmed}`;
  };

  const formatRoomDate = (value?: string | null) => {
    if (!value || typeof value !== 'string') return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isSameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const isSameWeek = diffMs < 7 * oneDayMs;

    if (isSameDay) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    if (isSameWeek) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    }

    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  // Инициализация ID текущего пользователя из localStorage
  useEffect(() => {
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    }
  }, []);

  // Трек ширины экрана для мобильного поведения
  useEffect(() => {
    const updateIsMobile = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth < 768);
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Реакция на смену initialRoomId (например, при открытии модалки с конкретным диалогом)
  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
    }
  }, [initialRoomId]);

  // Загрузка комнат
  useEffect(() => {
    if (role === 'guest') return;

    const fetchRooms = async () => {
      setLoadingRooms(true);
      const { data, error } = await chatApi.getRooms(onlyUnread);
      if (data) {
        setRooms(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load rooms:', error);
        setRooms([]);
      }
      setLoadingRooms(false);
    };

    fetchRooms();
  }, [role, onlyUnread]);

  // Выбор комнаты
  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
  };

  const handleBackToList = () => {
    setSelectedRoomId(null);
  };

  // Загрузка сообщений при выборе комнаты
  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await chatApi.getMessages(selectedRoomId);
      if (data) {
        const envelope = Array.isArray(data)
          ? { messages: data, job: undefined, resume: undefined }
          : data;
        const msgs = Array.isArray((envelope as any)?.messages) ? (envelope as any).messages : [];
        // API возвращает отсортированные по DESC (новые сверху), развернем для отображения снизу вверх
        setMessages([...msgs].reverse());
        setJobContext((envelope as any)?.job);
        setResumeContext((envelope as any)?.resume);
      } else {
        console.error('Failed to load messages:', error);
        setMessages([]);
        setJobContext(undefined);
        setResumeContext(undefined);
      }
      setLoadingMessages(false);
      
      // Сброс счетчика непрочитанных локально для выбранной комнаты
      setRooms(prev => prev.map(r => r.room_id === selectedRoomId ? { ...r, unread_count: 0 } : r));
    };

    fetchMessages();
  }, [selectedRoomId]);

  // Обработчик скролла сообщений
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 40;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setHasNewMessages(false);
    }
  };

  // Скролл к низу при новых сообщениях (только если пользователь у низа)
  useEffect(() => {
    if (!isAtBottom) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, isAtBottom]);

  // WebSocket подключение (для выбранной комнаты)
  useEffect(() => {
    if (!selectedRoomId) {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const envWsBase = process.env.NEXT_PUBLIC_WS_BASE_URL;
    const fallbackHttpBase = `${window.location.protocol}//localhost:8081`;
    const httpBase = (envWsBase && envWsBase.trim().length > 0 ? envWsBase.trim() : fallbackHttpBase).replace(/\/+$/, '');
    const wsBase = httpBase.startsWith('wss://')
      ? httpBase
      : httpBase.startsWith('ws://')
        ? httpBase
        : httpBase.startsWith('https://')
          ? `wss://${httpBase.slice('https://'.length)}`
          : httpBase.startsWith('http://')
            ? `ws://${httpBase.slice('http://'.length)}`
            : `ws://${httpBase}`;

    const wsUrl = `${wsBase}/ws/chat/${selectedRoomId}?token=${encodeURIComponent(`Bearer ${token}`)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to chat room ${selectedRoomId}`);
    };

    ws.onmessage = (event) => {
      try {
        const payload: ChatServerEnvelope = JSON.parse(event.data);
        
        switch (payload.type) {
          case 'message':
            const newMsg = payload.data as ChatMessage;
            // Добавляем сообщение только если его ещё нет в состоянии (защита от дублей)
            setMessages(prev => {
              if (prev.some(m => m.message_id === newMsg.message_id)) {
                return prev;
              }
              return [...prev, newMsg];
            });
            if (newMsg.room_id === selectedRoomId && typeof document !== 'undefined' && document.visibilityState === 'visible') {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const readMsg: ChatClientOutgoingMessage = { type: 'read', content: '' };
                wsRef.current.send(JSON.stringify(readMsg));
              }
            }
            // Также обновим инфо в списке комнат (последнее сообщение)
            setRooms(prev => prev.map(r => {
                if (r.room_id === newMsg.room_id) {
                    return {
                        ...r,
                        last_message_text: newMsg.message_text,
                        last_message_at: newMsg.sent_at,
                        unread_count: 0 // т.к. мы в этой комнате
                    };
                }
                return r;
            }));
            break;
            
          case 'typing':
             // { room_id, user_id, status: 'start'|'stop' }
             const typingData = payload.data as { user_id: string, status: string };
             // Тут можно проверить ID, чтобы не показывать свой же typing, 
             // но обычно с бэка приходит typing собеседника
             if (typingData.status === 'start') {
                 setIsTyping(true);
             } else {
                 setIsTyping(false);
             }
             break;
             
          case 'read': {
            const readData = payload.data as ChatReadEvent;

            // Игнорируем события о нашем собственном прочтении
            if (!currentUserId || readData.user_id === currentUserId) {
              break;
            }

            // Обновляем только текущую комнату
            if (readData.room_id !== selectedRoomId) {
              break;
            }

            const lastReadTime = new Date(readData.last_read_at).getTime();

            setMessages(prev =>
              prev.map(msg => {
                const isOwn = currentUserId ? msg.sender_id === currentUserId : false;
                if (!isOwn || msg.is_read) return msg;

                const msgTime = new Date(msg.sent_at).getTime();
                if (msgTime <= lastReadTime) {
                  return { ...msg, is_read: true };
                }

                return msg;
              })
            );

            break;
          }
            
           case 'room_list_refresh':
             // Приходит обновление комнаты.
             // Если мы внутри этой комнаты, игнорим unread_count (он 0), иначе обновляем
             break;
        }
      } catch (e) {
        console.error('WS message parse error', e);
      }
    };

    ws.onclose = () => {
      console.log('WS Disconnected');
    };

    return () => {
      ws.close();
    };
  }, [selectedRoomId]);

  // Обработка фокуса для отправки read
  useEffect(() => {
    const handleFocus = () => {
      if (!selectedRoomId) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const readMsg: ChatClientOutgoingMessage = { type: 'read', content: '' };
        wsRef.current.send(JSON.stringify(readMsg));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleFocus);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
      }
    };
  }, [selectedRoomId]);

  // Отправка сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !messageText.trim()) return;

    // Отправляем текст через REST, затем дожидаемся ответа
    const text = messageText;
    setMessageText(''); // Сразу очищаем инпут

    const { data, error } = await chatApi.sendMessage(selectedRoomId, text);
    if (data) {
      // Добавляем сообщение сразу после успешного ответа REST.
      // Если затем придёт echo по WebSocket с тем же message_id, он будет отфильтрован
      // логикой проверки в обработчике WS.
      setMessages(prev => {
        if (prev.some(m => m.message_id === data.message_id)) {
          return prev;
        }
        const next = [...prev, data];
        if (!isAtBottom) {
          setHasNewMessages(true);
        }
        return next;
      });
    } else {
      console.error('Send message error:', error);
      // Вернуть текст обратно в инпут, если не удалось отправить
      setMessageText(text);
    }
  };

  // Typing indicator в сокет
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
  };

  const activeRoom = rooms.find(r => r.room_id === selectedRoomId) || null;

  const formatMessageGroupDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const groupedMessages = messages.reduce<{ label: string; items: ChatMessage[] }[]>((acc, msg) => {
    const label = formatMessageGroupDate(msg.sent_at);
    const existing = acc.find((g) => g.label === label);
    if (existing) {
      existing.items.push(msg);
    } else {
      acc.push({ label, items: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-col md:flex-row">
      {/* Список комнат */}
      <div
        className={`bg-gray-50/50 border-gray-100 flex flex-col h-full overflow-hidden ${
          isMobile
            ? selectedRoomId
              ? 'hidden'
              : 'flex'
            : 'flex'
        } ${isMobile ? 'w-full' : 'md:w-[45%] lg:w-[42%] xl:w-[42%] border-r shrink-0'}`}
      >
        <div className="p-4 border-b border-gray-100 bg-white shrink-0">
          <label className="flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={onlyUnread} 
              onChange={(e) => setOnlyUnread(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Только непрочитанные</span>
          </label>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0">
            {loadingRooms ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : rooms.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                    Нет активных чатов
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {rooms.map((room) => {
                      const isActive = selectedRoomId === room.room_id;
                      const isJobSeeker = role === 'job_seeker';
                      const title = isJobSeeker
                        ? room.job_title
                        : room.applicant_full_name || 'Кандидат';
                      const subtitle = isJobSeeker
                        ? room.company_brand_name || room.company_name || 'Без названия'
                        : room.job_title || 'Вакансия';
                      const avatarUrl = isJobSeeker ? buildCompanyLogoSrc(room.company_logo_url) : buildPhotoSrc(room.photo_url);
                      const initials = getInitials(isJobSeeker ? subtitle : title);
                      const dateLabel = formatRoomDate(room.last_message_at);

                      return (
                        <div
                          key={room.room_id}
                          onClick={() => handleRoomSelect(room.room_id)}
                          className={`p-4 hover:bg-white cursor-pointer transition-colors ${
                            isActive ? 'bg-white shadow-sm border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={subtitle} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-semibold text-gray-500">{initials}</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{title}</h3>
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{dateLabel}</span>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-1">{subtitle}</p>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <p className={`text-sm line-clamp-1 flex-1 ${room.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                                  {room.last_message_text || <span className="italic text-gray-400">Нет сообщений</span>}
                                </p>
                                {room.unread_count > 0 && (
                                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                    {room.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* Область чата */}
      <div
        className={`flex-1 flex flex-col bg-white overflow-hidden min-h-0 ${
          isMobile && !selectedRoomId ? 'hidden' : 'flex'
        }`}
        style={{ minWidth: isMobile ? '100%' : '50%' }}
      >
        {selectedRoomId ? (
            <>
                {/* Шапка чата + карточка контекста (для соискателя) */}
                <div className="sticky top-0 z-20 bg-white shadow-sm">
                  {role !== 'job_seeker' ? (
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {isMobile && (
                          <button
                            onClick={handleBackToList}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                            aria-label="Назад к списку чатов"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        )}
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                          {buildPhotoSrc(activeRoom?.photo_url || resumeContext?.photo_url) ? (
                            <img
                              src={buildPhotoSrc(activeRoom?.photo_url || resumeContext?.photo_url) || undefined}
                              alt={resumeContext?.applicant_full_name || activeRoom?.applicant_full_name || 'Соискатель'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-gray-500">
                              {getInitials(resumeContext?.applicant_full_name || activeRoom?.applicant_full_name)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 truncate">
                            {resumeContext?.applicant_full_name || activeRoom?.applicant_full_name || 'Соискатель'}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {activeRoom?.job_title || jobContext?.job_title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    isMobile && (
                      <div className="p-2 border-b border-gray-100">
                        <button
                          onClick={handleBackToList}
                          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                          aria-label="Назад к списку чатов"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      </div>
                    )
                  )}

                  {role !== 'job_seeker' && resumeContext?.link_uuid && (
                    <div className="px-4 pb-4 border-b border-gray-100 bg-white">
                      <div className="border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 bg-white">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Резюме</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {resumeContext.resume_title}
                          </p>
                        </div>
                        <Link
                          href={`/resume/${resumeContext.link_uuid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 whitespace-nowrap"
                        >
                          Перейти
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h10M19 5v10M19 5l-14 14" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )}

                  {role === 'job_seeker' && jobContext && (
                    <div className="px-4 pb-4 border-b border-gray-100 bg-white space-y-3">
                      {/* Блок компании */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                          {jobContext.company_logo_url ? (
                            <img
                              src={buildCompanyLogoSrc(jobContext.company_logo_url) || undefined}
                              alt={jobContext.company_brand_name || jobContext.company_name || 'Компания'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-500">
                              {getInitials(jobContext.company_brand_name || jobContext.company_name)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {jobContext.company_brand_name || jobContext.company_name || 'Компания'}
                          </p>
                        </div>
                      </div>

                      {/* Блок вакансии с кнопкой перехода */}
                      <div className="border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 bg-white">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Вакансия</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {jobContext.job_title}
                          </p>
                        </div>
                        <Link
                          href={`/vacancy/${jobContext.job_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 whitespace-nowrap"
                        >
                          Перейти
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h10M19 5v10M19 5l-14 14" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Сообщения */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50"
                >
                  {loadingMessages ? (
                      <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                  ) : messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                          Напишите первое сообщение...
                      </div>
                  ) : (
                      groupedMessages.map((group) => (
                        <div key={group.label} className="space-y-3">
                          <div className="flex justify-center">
                            <span className="px-3 py-1 text-xs text-gray-500 bg-white border border-gray-200 rounded-full">
                              {group.label}
                            </span>
                          </div>
                          {group.items.map((msg) => {
                            const isOwn = currentUserId ? msg.sender_id === currentUserId : false;
                            
                            return (
                                <div key={msg.message_id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                                        isOwn 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                        <p className="text-sm leading-relaxed">{msg.message_text}</p>
                                        <div className={`text-[10px] mt-1 text-right ${
                                            isOwn ? 'text-blue-100' : 'text-gray-400'
                                        }`}>
                                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isOwn && (
                                                <span className="inline-flex items-center ml-1 align-middle">
                                                    {msg.is_read ? (
                                                        <svg
                                                            className="w-3 h-3"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M9 12.75L11.25 15L15 9.75"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                            <path
                                                                d="M5 13L7.5 15.5L11 10"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            className="w-3 h-3"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M5 13L9 17L17 7"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                          })}
                        </div>
                      ))
                  )}
                  {isTyping && (
                       <div className="flex justify-start animate-pulse">
                          <div className="bg-gray-100 text-gray-500 rounded-full px-3 py-1 text-xs">
                              печатает...
                          </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {hasNewMessages && !isAtBottom && (
                    <div className="px-4 pb-2 flex justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAtBottom(true);
                                const container = messagesContainerRef.current;
                                if (container) {
                                  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                                }
                                setHasNewMessages(false);
                            }}
                            className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 transition-colors"
                        >
                            Новое сообщение снизу
                        </button>
                    </div>
                )}

                {/* Ввод сообщения */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={messageText}
                            onChange={handleInputChange}
                            placeholder="Напишите сообщение..."
                            className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!messageText.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 font-medium transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </form>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <p>Выберите чат для начала общения</p>
            </div>
        )}
      </div>
    </div>
  );
}
