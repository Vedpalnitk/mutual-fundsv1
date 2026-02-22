/**
 * Chat API — AI Chat Sessions and Messages
 */
import { request } from '../api'

// ============= Chat API =============

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ChatMessageResponse {
  messageId: string;
  status: 'processing' | 'complete' | 'error';
  createdAt: string;
}

export interface ChatMessageStatus {
  messageId: string;
  status: 'processing' | 'complete' | 'error';
  content?: string;
  error?: string;
}

export interface ChatMessageDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const chatApi = {
  createSession: (title?: string) =>
    request<ChatSession>('/api/v1/chat/sessions', {
      method: 'POST',
      body: { title },
    }),

  getSessions: () =>
    request<ChatSession[]>('/api/v1/chat/sessions'),

  getSessionMessages: (sessionId: string) =>
    request<ChatMessageDto[]>(`/api/v1/chat/sessions/${sessionId}/messages`),

  sendMessage: (sessionId: string, content: string) =>
    request<ChatMessageResponse>('/api/v1/chat/messages', {
      method: 'POST',
      body: { sessionId, content },
    }),

  getMessageStatus: (messageId: string) =>
    request<ChatMessageStatus>(`/api/v1/chat/messages/${messageId}/status`),
};
