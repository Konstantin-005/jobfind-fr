'use client';

import Header from './components/Header';
import { ChatProvider } from './context/ChatContext';
import ChatFloatingButton from './components/ChatFloatingButton';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <Header />
      <main className="min-h-screen bg-gray-50">{children}</main>
      <ChatFloatingButton />
    </ChatProvider>
  );
} 