import { api } from "./client";

export const adminQnaApi = {
  // QnA 답변 등록
  answerQna: (qnaId: number, data: { askContent: string }) =>
    api.post(`/admin/qna/${qnaId}`, data),
  // QnA 답변 수정
  updateQnaAnswer: (qnaId: number, data: { askContent: string }) =>
    api.put(`/admin/qna/${qnaId}`, data),
};
