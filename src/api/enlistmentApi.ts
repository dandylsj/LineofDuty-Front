// src/api/enlistmentApi.ts
import { api } from "./client";

/* =====================
   Types
===================== */
export interface EnlistmentScheduleCreateRequest {
  scheduleId: number;
}

export interface EnlistmentQuery {
  page?: number;
  size?: number;
  sort?: string;
  pageable?: any;
}

export interface ApplicationQuery {
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
  userId?: number;
}

export interface DefermentsPostRequest {
  applicationId?: number;
  defermentStatus?:
    | "ILLNESS"
    | "STUDY"
    | "FAMILY"
    | "PERSONAL"
    | "SIMPLECHANGE"
    | "APPROVED"
    | "REJECTED";
  reasonDetail?: string;
  scheduleId?: number;
}

export interface DefermentPatchRequest {
  decisionStatus:
    | "ILLNESS"
    | "STUDY"
    | "FAMILY"
    | "PERSONAL"
    | "SIMPLECHANGE"
    | "APPROVED"
    | "REJECTED";
}

export interface DefermentQuery {
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}

/* =====================
   Enlistment Schedule API
===================== */
export const enlistmentApi = {
  // 입영 일정 목록 조회
  getEnlistmentList: (page: number = 0, size: number = 100) =>
    api.get("/enlistment", {
      params: { 
        page, 
        size,
      },
    }),

  // 입영 일정 상세 조회
  getEnlistment: (scheduleId: number) =>
    api.get(`/enlistment/${scheduleId}`),

  // 이번주 입영 일정 요약
  getThisWeekSummary: (nx?: number, ny?: number) =>
    api.get("/enlistment/thisWeek", { params: { nx, ny } }),

  // 입영 일정 검색
  searchEnlistment: (
    startDate: string,
    endDate: string,
    params?: EnlistmentQuery
  ) =>
    api.get("/enlistment/search", {
      params: { startDate, endDate, ...params },
    }),

  /* =====================
     Enlistment Application
  ===================== */
  // 입영 신청 목록 조회
  getApplicationList: (params?: ApplicationQuery) =>
    api.get("/enlistment-applications", { params }),

  // 입영 신청 상세 조회
  getApplication: (applicationId: number) =>
    api.get(`/enlistment-applications/${applicationId}`),

  // 입영 신청
  applyEnlistment: (data: EnlistmentScheduleCreateRequest) =>
    api.post("/enlistment-applications", data),

  // 입영 신청 취소
  cancelApplication: (applicationId: number) =>
    api.patch(`/enlistment-applications/${applicationId}/cancel`),

  /* =====================
     Deferment (연기)
  ===================== */
  // 연기 신청
  applyDeferment: (data: DefermentsPostRequest) =>
    api.post("/deferments", data),

  // 연기 신청 상세 조회
  getDeferment: (defermentsId: number) =>
    api.get(`/deferments/${defermentsId}`),

  // (유저) 연기 신청 목록 조회
  // 백엔드: @GetMapping("") getDefermentList(Pageable pageable)
  getDeferments: (params?: DefermentQuery) => api.get("/deferments", { params }),

  /* =====================
     Admin API
  ===================== */
  // 관리자: 입영 일정 생성
  createEnlistmentSchedule: () =>
    api.post("/admin/enlistment-schedule"),

  // 관리자: 입영 신청 승인
  approveApplication: (applicationId: number) =>
    api.patch(`/admin/enlistment-applications/${applicationId}/approve`),

  // 관리자: 일괄 승인
  approveApplicationBulk: () =>
    api.patch("/admin/enlistment-applications/approve/bulk"),

  // 관리자: 연기 처리
  processDeferment: (defermentsId: number, data: DefermentPatchRequest) =>
    api.patch(`/admin/deferments/${defermentsId}`, data),

  // 관리자: 연기 일괄 처리
  processDefermentBulk: (data: DefermentPatchRequest) =>
    api.patch("/admin/deferments/bulk", data),

  // 관리자: 연기 목록 조회
  getDefermentList: (params?: EnlistmentQuery) =>
    api.get("/admin/deferments", { params }),
};

