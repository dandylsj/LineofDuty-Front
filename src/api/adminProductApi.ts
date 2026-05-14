import { api } from './client';

export type DeliveryType = 'STANDARD' | 'SAME_DAY' | 'DAWN';

export interface AdminProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId?: number | null;
  shippingFee?: number;
  freeShippingThreshold?: number | null;
  deliveryType?: DeliveryType;
  detailContent?: string;
}

export const adminProductApi = {
  createProduct: (data: AdminProductRequest) => api.post('/admin/products', data),
  updateProduct: (productId: number, data: AdminProductRequest) =>
    api.put(`/admin/products/${productId}`, data),
  deleteProduct: (productId: number) => api.delete(`/admin/products/${productId}`),

  // 대표 이미지
  uploadProductImage: (productId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/products/${productId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 상세 이미지
  addDetailImage: (productId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDetailImages: (productId: number) => api.get(`/products/${productId}/images`),
  deleteDetailImage: (productId: number, imageId: number) =>
    api.delete(`/admin/products/${productId}/images/${imageId}`),
};
