// src/api/orderApi.ts
import { api } from "./client";

/* =====================
   Types
===================== */
export interface OrderCreateRequest {
  productId: number;
  quantity: number;
}

export interface OrderUpdateRequest {
  productId: number;
  quantity: number;
}

// 백엔드 OrderCreateResponse DTO
export interface OrderCreateData {
  id: number;
  userId: number;
  orderName: string;
  orderNumber: string;
  totalPrice: number;
  createdAt: string;
  modifiedAt: string;
}

// 백엔드 OrderGetResponse DTO
export interface OrderGetData {
  userId: number;
  userName: string;
  orderId: number;
  orderNumber: string;
  totalPrice: number;
  isOrderCompleted: boolean;
  paymentStatus: string | null;
  createdAt: string;
  modifiedAt: string;
}

// 공통 API 응답 래퍼
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/* =====================
   API
===================== */
export const orderApi = {
  createOrder: (data: OrderCreateRequest) =>
    api.post<ApiResponse<OrderCreateData>>("/orders", data),

  getOrder: (orderId: number) =>
    api.get<ApiResponse<OrderGetData>>(`/orders/${orderId}`),

  deleteOrder: (orderId: number) =>
    api.delete(`/orders/${orderId}`),

  getOrderItem: (orderId: number, orderItemId: number) =>
    api.get(`/orders/${orderId}/orderItems/${orderItemId}`),

  updateOrderItem: (
    orderId: number,
    orderItemId: number,
    data: OrderUpdateRequest
  ) =>
    api.patch(
      `/orders/${orderId}/orderItems/${orderItemId}`,
      data
    ),
};
