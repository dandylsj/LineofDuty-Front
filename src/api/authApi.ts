// src/api/authApi.ts
import { api } from "./client";

/* =====================
   Types
===================== */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  admin?: boolean;
  adminToken?: string;
}

export interface TokenRequest {
  refreshToken: string;
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
}

/* =====================
   API
===================== */
export const authApi = {
  signup: (data: SignupRequest) =>
    api.post("/auth/signup", data),

  login: (data: LoginRequest) =>
    api.post("/auth/login", data),

  reissue: (data: TokenRequest) =>
    api.post("/auth/reissue", data),

  logout: () =>
    api.post("/auth/logout"),

  // 카카오 로그인
  kakaoLogin: (code: string) =>
    api.get("/auth/kakao/callback", { params: { code } }),

  // 이메일 인증 발송 (엔드포인트가 다를 경우 백엔드에 맞게 수정)
  sendVerificationEmail: (email: string) =>
    api.post("/auth/email/send", { email }),

  // 이메일 코드 검증 (엔드포인트가 다를 경우 백엔드에 맞게 수정)
  verifyEmailCode: (data: EmailVerificationRequest) =>
    api.post("/auth/email/verify", data),
};
