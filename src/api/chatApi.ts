// src/api/chatApi.ts
import { api } from "./client";

/* =====================
   Types
===================== */
export interface SendRequest {
  content: string;
}

export interface ChatQuery {
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}

/* =====================
   API
===================== */
export const chatApi = {
  // 채팅 메시지 목록 조회
  getMessages: (params?: ChatQuery) =>
    api.get("/chat/messages", { params }),

  // 메시지 전송
  sendMessage: (data: SendRequest) =>
    api.post("/chat/messages", data),

  // 내 채팅방 조회
  getMyChatRoom: () =>
    api.get("/chat/room"),

  // 스레드 조회
  getThread: (messageId: number, params?: ChatQuery) =>
    api.get(`/chat/messages/${messageId}/thread`, { params }),

  // 채팅방 초기화
  resetChatRoom: () =>
    api.delete("/chat/room/reset"),
};
