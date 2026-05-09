// src/api/fileApi.ts
import { api } from "./client";

/* =====================
   File Upload API
===================== */
export const fileApi = {
  // 파일 업로드
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
