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

// 백엔드 주문 상품 항목
export interface OrderItemData {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  productImageUrl?: string;
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
// 백엔드 버전에 따라 camelCase / snake_case 혼용 가능성이 있어 optional로 선언
export interface OrderGetData {
  // 주문 식별자 (버전에 따라 id 또는 orderId)
  id?: number;
  orderId?: number;
  userId?: number;
  userName?: string;
  orderNumber?: string;
  orderName?: string;
  // 주문 상태 (PENDING / PAID / SHIPPING / DELIVERED / CANCELLED 등)
  status?: string;
  paymentStatus?: string | null;
  isOrderCompleted?: boolean;
  // 금액 (camelCase 우선, snake_case 폴백)
  totalPrice?: number;
  total_price?: number;
  // 날짜 (camelCase 우선, snake_case 폴백)
  createdAt?: string;
  created_at?: string;
  modifiedAt?: string;
  // 주문 상품 목록 (키 이름이 다를 수 있음)
  orderItems?: OrderItemData[];
  items?: OrderItemData[];
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
