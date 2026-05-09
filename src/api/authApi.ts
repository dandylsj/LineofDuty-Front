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
};
