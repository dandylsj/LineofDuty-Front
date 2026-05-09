import { api } from "./client";

/* =====================
   S3 Upload API
===================== */
export const s3Api = {
  // S3 업로드 (파일 업로드)
  uploadToS3: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
