'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useUser } from '../components/useUser';
import { chatApi } from '../utils/api';

interface ChatContextType {
  totalUnread: number;
  isChatOpen: boolean;
  openChat: () => void;
  openChatWithRoom: (roomId: number | null | undefined) => void;
  closeChat: () => void;
  toggleChat: () => void;
  refreshUnreadCount: () => Promise<void>;
  initialRoomId: number | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { role } = useUser();
  const [totalUnread, setTotalUnread] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialRoomId, setInitialRoomId] = useState<number | null>(null);
  
  const openChat = () => setIsChatOpen(true);
  const openChatWithRoom = (roomId: number | null | undefined) => {
    setInitialRoomId(roomId ?? null);
    setIsChatOpen(true);
  };
  const closeChat = () => {
    setIsChatOpen(false);
    setInitialRoomId(null);
  };
  const toggleChat = () => setIsChatOpen(prev => !prev);

  const refreshUnreadCount = async () => {
    if (role === 'guest') {
      setTotalUnread(0);
      return;
    }
    const { data } = await chatApi.getRooms();
    if (data) {
      const rooms = Array.isArray(data) ? data : [];
      const count = rooms.reduce((acc, room) => acc + room.unread_count, 0);
      setTotalUnread(count);
    }
  };

  useEffect(() => {
    if (role === 'guest') return;
    refreshUnreadCount();
    
    // Временно отключено автообновление по интервалу
    return () => {};
  }, [role]);

  return (
    <ChatContext.Provider value={{ 
      totalUnread, 
      isChatOpen, 
      openChat, 
      openChatWithRoom,
      closeChat, 
      toggleChat,
      refreshUnreadCount,
      initialRoomId,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
