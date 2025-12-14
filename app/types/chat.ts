/**
 * @file: chat.ts
 * @description: Типы данных для клиентского чата (комнаты и сообщения)
 * @dependencies: app/config/api, app/utils/api
 * @created: 2025-12-11
 */

export interface ChatRoomSummary {
  room_id: number;
  application_id: number;
  job_title: string;
  applicant_full_name?: string; // для работодателя
  photo_url?: string | null; // для работодателя
  company_brand_name?: string; // для соискателя
  company_name?: string; // для соискателя
  company_logo_url?: string | null; // для соискателя
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface ChatMessage {
  message_id: number;
  room_id: number;
  sender_id: string;
  message_text: string;
  sent_at: string;
  is_read: boolean;
}

export interface ChatJobContext {
  job_id: number;
  job_title: string;
  company_name?: string;
  company_brand_name?: string;
  company_logo_url?: string | null;
}

export interface ChatResumeContext {
  resume_id?: number;
  link_uuid?: string;
  resume_title: string;
  applicant_full_name?: string;
  photo_url?: string | null;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  job?: ChatJobContext;
  resume?: ChatResumeContext;
}

export interface ChatReadEvent {
  room_id: number;
  user_id: string;
  last_read_at: string;
}

export interface ChatTypingEvent {
  room_id: number;
  user_id: string;
  status: 'start' | 'stop';
}

export type ChatClientOutgoingMessage =
  | { type: 'message'; content: string }
  | { type: 'read'; content: string }
  | { type: 'typing'; content: string };

export type ChatServerEventType = 'message' | 'read' | 'typing' | 'room_list_refresh';

export interface ChatServerEnvelope<T = unknown> {
  type: ChatServerEventType;
  data: T;
}
