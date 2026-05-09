import { api } from "./client";

export const adminUserApi = {
  // 전체 유저 목록
  getAllUsers: () => api.get("/admin/users"),
  // 유저 상세
  getUser: (userId: number) => api.get(`/admin/users/${userId}`),
  // 유저 탈퇴
  withdrawAdmin: (userId: number, data: { password: string }) =>
    api.delete(`/admin/users/${userId}`, { data }),
};
