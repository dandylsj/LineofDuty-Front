import { api } from "./client";

export const adminProductApi = {
  // 상품 등록
  createProduct: (data: any) => api.post("/admin/products", data),
  // 상품 수정
  updateProduct: (productId: number, data: any) =>
    api.put(`/admin/products/${productId}`, data),
  // 상품 삭제
  deleteProduct: (productId: number) =>
    api.delete(`/admin/products/${productId}`),
  // 상품 이미지 업로드
  uploadProductImage: (productId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/admin/products/${productId}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
