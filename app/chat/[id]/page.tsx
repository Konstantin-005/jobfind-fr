/**
 * @file: page.tsx
 * @description: Страница чата по прямому URL /chat/[id], открывающая выбранный диалог
 * @dependencies: app/chat/ChatPageView
 * @created: 2025-12-22
 */
import React from 'react';
import ChatPageView from '../ChatPageView';

interface ChatRoomPageProps {
  params: { id: string };
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const roomId = Number(params.id);
  const initialRoomId = Number.isFinite(roomId) ? roomId : undefined;

  return <ChatPageView initialRoomId={initialRoomId} />;
}
