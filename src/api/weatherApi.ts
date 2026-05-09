// src/api/weatherApi.ts
import { api } from "./client";

/* =====================
   API
===================== */
export const weatherApi = {
  // 오늘 날씨 조회
  getTodayWeather: (nx?: number, ny?: number) =>
    api.get("/weather/today", {
      params: { nx: nx || 36, ny: ny || 127 },
    }),

  // 중기 예보 조회
  getMidFcst: (landRegId?: string, tempRegId?: string) =>
    api.get("/weather/mid-fcst", {
      params: {
        landRegId: landRegId || "11B00000",
        tempRegId: tempRegId || "11B10101",
      },
    }),
};
