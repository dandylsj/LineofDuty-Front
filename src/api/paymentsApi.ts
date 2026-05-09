// src/api/paymentsApi.ts
import { api } from "./client";

/* =====================
   Types
===================== */

export interface PaymentCreateRequest {
  orderId: number;
  paymentKey?: string;
}

export interface PaymentConfirmRequest {
  paymentKey: string;
}

export interface PaymentCancelRequest {
  cancelReason: string;
}

/* =====================
   Payments API
===================== */

export const paymentsApi = {
  /**
   * 결제 생성 (주문 → 결제 준비)
   * POST /api/payments
   */
  createPayment: (data: PaymentCreateRequest) =>
    api.post("/payments", data),

  /**
   * 결제 승인 (PG 결제 성공 후 호출)
   * POST /api/payments/confirm
   */
  confirmPayment: (data: PaymentConfirmRequest) =>
    api.post("/payments/confirm", data),

  /**
   * 결제 취소
   * POST /api/payments/{paymentKey}/cancel
   */
  cancelPayment: (paymentKey: string, data: PaymentCancelRequest) =>
    api.post(`/payments/${paymentKey}/cancel`, data),

  /**
   * 결제 단건 조회 (paymentKey 기준)
   * GET /api/payments/{paymentKey}
   */
  getPaymentByPaymentKey: (paymentKey: string) =>
    api.get(`/payments/${paymentKey}`),

  /**
   * 주문 기준 결제 조회
   * GET /api/payments/orders/{orderNumber}
   */
  getPaymentByOrderNumber: (orderNumber: string) =>
    api.get(`/payments/orders/${orderNumber}`),
};

