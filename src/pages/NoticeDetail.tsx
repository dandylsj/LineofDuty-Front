import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { noticeApi } from "../api/noticeApi";

export default function NoticeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    noticeApi
      .getNotice(parseInt(id, 10))
      .then((res) => {
        setNotice(res.data?.data);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <>
      <Header />

      <main style={styles.container}>
        <div style={styles.wrapper}>
          {loading ? (
            <div style={styles.loadingMessage}>로딩 중...</div>
          ) : notice ? (
            <article style={styles.detailSection}>
              <button
                onClick={() => navigate("/notices")}
                style={styles.backBtn}
              >
                ← 돌아가기
              </button>

              <h1 style={styles.title}>{notice.title}</h1>

              <div style={styles.meta}>
                <span style={styles.date}>
                  {new Date(notice.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div style={styles.divider}></div>

              <div style={styles.content}>{notice.content}</div>
            </article>
          ) : (
            <div style={styles.notFoundMessage}>공지사항을 찾을 수 없습니다.</div>
          )}
        </div>
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

  wrapper: {
    display: "grid",
    gap: "20px",
  } as const,

  detailSection: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  } as const,

  emptySection: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  } as const,

  backBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#4a6cf7",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "16px",
    padding: "0",
  } as const,

  title: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 12px 0",
    color: "#222",
  } as const,

  meta: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  } as const,

  date: {
    fontSize: "13px",
    color: "#999",
  } as const,

  divider: {
    height: "1px",
    backgroundColor: "#eee",
    margin: "16px 0",
  } as const,

  content: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#444",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  } as const,

  loadingMessage: {
    textAlign: "center" as const,
    padding: "40px",
    color: "#999",
  } as const,

  notFoundMessage: {
    textAlign: "center" as const,
    padding: "40px",
    color: "#999",
  } as const,
};
