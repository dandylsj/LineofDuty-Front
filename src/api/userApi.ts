// src/api/userApi.ts
import { api } from "./client";

/* =====================
   Types
===================== */
export interface UserUpdateRequest {
  email?: string;
  currentPassword: string;
  newPassword?: string;
}

export interface UserWithdrawRequest {
  password: string;
}

/* =====================
   API
===================== */
export const userApi = {
  // 사용자 프로필 조회
  getProfile: (userId: number) =>
    api.get(`/users/${userId}`),

  // 사용자 프로필 수정
  updateProfile: (userId: number, data: UserUpdateRequest) =>
    api.put(`/users/${userId}`, data),

  // 회원 탈퇴
  withdrawUser: (userId: number, data: UserWithdrawRequest) =>
    api.delete(`/users/${userId}`, { data }),

  // 프로필 이미지 업로드
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/users/profile-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
