import { enlistmentApi } from "./enlistmentApi";
import { noticeApi } from "./noticeApi";

function normalizeText(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function includesKeyword(haystack: unknown, keyword: string) {
  const k = keyword.trim().toLowerCase();
  if (!k) return false;
  return normalizeText(haystack).includes(k);
}

function extractList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export type SearchResult = {
  keyword: string;
  notices: any[];
  schedules: any[];
};

export const searchApi = {
  searchHome: async (keyword: string): Promise<SearchResult> => {
    const k = keyword.trim();
    if (!k) return { keyword: "", notices: [], schedules: [] };

    const [noticesRes, enlistmentRes] = await Promise.all([
      noticeApi.getNoticeList({ page: 0, size: 50 }),
      enlistmentApi.getEnlistmentList(0, 200),
    ]);

    const noticesRaw = extractList(noticesRes.data?.data);
    const schedulesRaw = extractList(enlistmentRes.data?.data);

    const notices = noticesRaw.filter((n: any) => {
      const title = n?.title ?? "";
      const content = n?.content ?? "";
      return includesKeyword(title, k) || includesKeyword(content, k);
    });

    const schedules = schedulesRaw.filter((s: any) => {
      const enlistmentDate = s?.enlistmentDate ?? s?.date ?? "";
      const weatherDesc = s?.weather?.description ?? "";
      return includesKeyword(enlistmentDate, k) || includesKeyword(weatherDesc, k);
    });

    return { keyword: k, notices, schedules };
  },
};
