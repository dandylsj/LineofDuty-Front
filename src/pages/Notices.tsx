import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { noticeApi } from "../api/noticeApi";

export default function Notices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    noticeApi
      .getNoticeList({ page: 0, size: 20 })
      .then((res) => {
        const data = res.data?.data;
        setNotices(Array.isArray(data) ? data : data?.content || []);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleNoticeClick = (noticeId: number) => {
    navigate(`/notices/${noticeId}`);
  };

  return (
    <>
      <Header />

      <main style={styles.container}>
        <div style={styles.wrapper}>
          {/* 공지사항 섹션 */}
          <section style={styles.noticeSection}>
            <h2 style={styles.title}>공지사항</h2>

            {loading ? (
              <div style={styles.loadingMessage}>로딩 중...</div>
            ) : notices.length > 0 ? (
              <div style={styles.noticeList}>
                {notices.map((notice: any) => (
                  <div
                    key={notice.id}
                    style={styles.noticeItem}
                    onClick={() => handleNoticeClick(notice.id)}
                  >
                    <h3 style={styles.noticeTitle}>{notice.title}</h3>
                    <p style={styles.noticeContent}>
                      {notice.content?.substring(0, 100)}
                      {notice.content?.length > 100 ? "..." : ""}
                    </p>
                    <p style={styles.noticeDate}>
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyMessage}>공지사항이 없습니다.</div>
            )}
          </section>
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

  noticeSection: {
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

  title: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#222",
  } as const,

  noticeList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  } as const,

  noticeItem: {
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #eee",
    backgroundColor: "#f9fafb",
    cursor: "pointer",
    transition: "all 0.2s ease",
  } as const,

  noticeTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 8px 0",
    color: "#222",
  } as const,

  noticeContent: {
    fontSize: "13px",
    color: "#666",
    margin: "0 0 8px 0",
    lineHeight: "1.5",
  } as const,

  noticeDate: {
    fontSize: "12px",
    color: "#999",
    margin: "0",
  } as const,

  loadingMessage: {
    textAlign: "center" as const,
    padding: "40px",
    color: "#999",
  } as const,

  emptyMessage: {
    textAlign: "center" as const,
    padding: "40px",
    color: "#999",
  } as const,
};
