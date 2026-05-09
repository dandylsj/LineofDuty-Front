import Header from "../components/Header";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchApi } from "../api/searchApi";

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = useMemo(() => (searchParams.get("q") ?? "").trim(), [searchParams]);

  const [input, setInput] = useState(q);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    setInput(q);
  }, [q]);

  useEffect(() => {
    if (!q) {
      setNotices([]);
      setSchedules([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    searchApi
      .searchHome(q)
      .then((res) => {
        if (cancelled) return;
        setNotices(res.notices);
        setSchedules(res.schedules);
      })
      .catch(() => {
        if (cancelled) return;
        setError("검색 중 오류가 발생했습니다.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q]);

  const submit = () => {
    const next = input.trim();
    if (!next) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: next });
  };

  return (
    <>
      <Header />
      <main style={styles.container}>
        <section style={styles.hero}>
          <h1 style={styles.title}>검색</h1>
          <div style={styles.searchBox}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="입영 일정, 공지사항 등을 검색해보세요."
              style={styles.input}
            />
            <button style={styles.searchBtn} onClick={submit}>
              검색
            </button>
          </div>
          {q ? <p style={styles.subText}>"{q}" 검색 결과</p> : null}
        </section>

        {loading ? <p style={styles.muted}>로딩 중...</p> : null}
        {error ? <p style={styles.error}>{error}</p> : null}

        {!loading && !error && q ? (
          <section style={styles.resultsGrid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>공지사항 ({notices.length})</h3>
              {notices.length === 0 ? (
                <p style={styles.muted}>검색 결과가 없습니다</p>
              ) : (
                <div style={styles.list}>
                  {notices.slice(0, 20).map((notice: any) => (
                    <div
                      key={notice.id}
                      style={styles.listItem}
                      onClick={() => navigate(`/notices/${notice.id}`)}
                    >
                      <div style={styles.itemTitle}>{notice.title}</div>
                      <div style={styles.itemSub}>
                        {String(notice.content ?? "").substring(0, 80)}
                        {String(notice.content ?? "").length > 80 ? "..." : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button style={styles.linkBtn} onClick={() => navigate("/notices")}> 
                공지사항으로 이동
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>입영 일정 ({schedules.length})</h3>
              {schedules.length === 0 ? (
                <p style={styles.muted}>검색 결과가 없습니다</p>
              ) : (
                <div style={styles.list}>
                  {schedules.slice(0, 20).map((s: any, idx: number) => (
                    <div key={s?.scheduleId ?? s?.id ?? idx} style={styles.listItem}>
                      <div style={styles.itemTitle}>
                        {s?.enlistmentDate ?? s?.date ?? "날짜 미정"}
                      </div>
                      <div style={styles.itemSub}>
                        잔여: {s?.remainingSlots ?? 0}명
                        {s?.weather?.description ? ` · ${s.weather.description}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button style={styles.linkBtn} onClick={() => navigate("/enlistment")}> 
                입영 일정으로 이동
              </button>
            </div>
          </section>
        ) : null}

        {!loading && !error && !q ? (
          <p style={styles.muted}>검색어를 입력해 주세요.</p>
        ) : null}
      </main>
    </>
  );
}

const styles = {
  container: {
    padding: "40px",
    width: "inherit",
    backgroundColor: "#f5f7fb",
    minHeight: "100vh",
    color: "#213547",
  } as const,

  hero: {
    textAlign: "center" as const,
    marginBottom: "24px",
  } as const,

  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "16px",
  } as const,

  subText: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#666",
  } as const,

  searchBox: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  } as const,

  input: {
    width: "400px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  } as const,

  searchBtn: {
    padding: "12px 20px",
    borderRadius: "8px",
    backgroundColor: "#4b6bff",
    color: "white",
    border: "none",
    cursor: "pointer",
  } as const,

  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    alignItems: "start",
  } as const,

  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  } as const,

  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 12px 0",
  } as const,

  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
    marginBottom: "12px",
  } as const,

  listItem: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #eee",
    backgroundColor: "#f9fafb",
    cursor: "pointer",
  } as const,

  itemTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#222",
  } as const,

  itemSub: {
    fontSize: "12px",
    color: "#666",
    lineHeight: "1.4",
  } as const,

  linkBtn: {
    backgroundColor: "#4b6bff",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  } as const,

  muted: {
    fontSize: "14px",
    color: "#999",
    textAlign: "center" as const,
  } as const,

  error: {
    fontSize: "14px",
    color: "#d00",
    textAlign: "center" as const,
  } as const,
};
