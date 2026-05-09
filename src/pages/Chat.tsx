import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { chatApi } from "../api/chatApi";
import { useAuth } from "../hooks/userAuth";
import "../styles/chat.css";

type UiMessage = {
  id: string;
  content: string;
  createdAt?: string;
  fromUser: boolean;
  raw?: any;
};

function parseTimeMs(value?: string): number {
  if (!value) return NaN;

  // 1) try as-is (ISO 등)
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;

  // 2) DB 포맷 지원: "YYYY-MM-DD HH:mm:ss.SSSSSS" (마이크로초)
  // JS Date는 보통 "T" 구분자와 밀리초(3자리)까지만 안정적으로 파싱
  const trimmed = value.trim();
  const normalized = trimmed.replace(" ", "T");

  // 마이크로초 → 밀리초로 절삭
  // 예: 2026-02-13T15:28:24.860346 -> 2026-02-13T15:28:24.860
  const microFixed = normalized.replace(/\.(\d{3})\d+$/, ".$1");
  const fixed = Date.parse(microFixed);
  if (!Number.isNaN(fixed)) return fixed;

  // 3) 마지막 fallback: milliseconds 없는 형태
  const noFraction = normalized.replace(/\.(\d+)$/, "");
  const fallback = Date.parse(noFraction);
  return fallback;
}

function formatKo(value?: string) {
  const ms = parseTimeMs(value);
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toLocaleString("ko-KR");
}

function normalizeListPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.messages)) return payload.messages;
  return [];
}

function flattenMessagesWithReply(list: any[]) {
  const flat: any[] = [];
  for (const item of list) {
    if (!item) continue;
    flat.push(item);
    if (item?.reply) {
      flat.push(item.reply);
    }
  }
  return flat;
}

function inferFromUser(message: any): boolean {
  const candidate =
    message?.senderType ??
    message?.sender ??
    message?.role ??
    message?.author ??
    message?.messageType;
  if (!candidate) return false;
  const text = String(candidate).toLowerCase();
  if (text === "user") return true;
  if (text === "ai" || text === "assistant" || text === "bot") return false;
  return text.includes("user") || text.includes("client") || text.includes("customer");
}

function toUiMessage(message: any, index: number): UiMessage {
  const id =
    message?.id != null
      ? String(message.id)
      : message?.messageId != null
        ? String(message.messageId)
        : `tmp-${Date.now()}-${index}`;

  const content =
    typeof message?.content === "string"
      ? message.content
      : typeof message?.message === "string"
        ? message.message
        : typeof message?.text === "string"
          ? message.text
          : "";

  const createdAt =
    typeof message?.createdAt === "string"
      ? message.createdAt
      : typeof message?.created_at === "string"
        ? message.created_at
        : undefined;

  return {
    id,
    content,
    createdAt,
    fromUser: inferFromUser(message),
    raw: message,
  };
}

function getErrorMessage(error: unknown) {
  const anyErr = error as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    "요청 처리 중 오류가 발생했습니다."
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(() => {
    // 서버가 desc로 주는 경우가 많아서, 화면엔 오래된 것부터 보이도록 정렬
    // createdAt 없으면 입력 순서를 최대한 유지
    const copy = [...messages];
    copy.sort((a, b) => {
      const at = parseTimeMs(a.createdAt);
      const bt = parseTimeMs(b.createdAt);
      if (Number.isNaN(at) || Number.isNaN(bt)) return 0;
      return at - bt;
    });
    return copy;
  }, [messages]);

  const fetchMessages = async (nextPage: number) => {
    const res = await chatApi.getMessages({
      page: nextPage,
      size: 20,
      sort: "createdAt",
      direction: "desc",
    });

    const pageData = res.data?.data;
    const list = normalizeListPayload(pageData);
    const flattened = flattenMessagesWithReply(list);
    const ui = flattened.map((m, idx) => toUiMessage(m, idx));

    // desc로 받아온 페이지를 기존과 합칠 때 중복 제거
    setMessages((prev) => {
      const merged = nextPage === 0 ? ui : [...prev, ...ui];
      const map = new Map<string, UiMessage>();
      for (const item of merged) {
        if (!item.id) continue;
        map.set(item.id, item);
      }
      return Array.from(map.values());
    });

    // hasMore 판단: pageable 메타데이터가 있으면 그걸 우선 사용
    const totalPages = typeof pageData?.totalPages === "number" ? pageData.totalPages : null;
    if (typeof totalPages === "number" && totalPages >= 0) {
      setHasMore(nextPage + 1 < totalPages);
    } else {
      setHasMore(list.length >= 20);
    }

    return ui;
  };

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    if (!isLoggedIn) return;

    let canceled = false;
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        // 채팅방 존재/생성 확인
        await chatApi.getMyChatRoom();
        if (canceled) return;
        setPage(0);
        await fetchMessages(0);
      } catch (e) {
        if (canceled) return;
        setError(getErrorMessage(e));
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    init();
    return () => {
      canceled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length, sending]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    const sentAtMs = Date.now();

    setSending(true);
    setError("");
    setInput("");

    try {
      await chatApi.sendMessage({ content });

      // 응답(봇 메시지)이 비동기 생성될 수 있으니, 잠깐 폴링해서 AI 답변까지 붙여서 보여줌
      setPage(0);
      await fetchMessages(0);
      for (let attempt = 0; attempt < 10; attempt++) {
        await sleep(700);
        const latest = await fetchMessages(0);
        const hasNewBotReply = latest.some((m) => {
          if (m.fromUser) return false;
          const ms = parseTimeMs(m.createdAt);
          return !Number.isNaN(ms) && ms >= sentAtMs;
        });
        if (hasNewBotReply) break;
      }
    } catch (err) {
      setError(getErrorMessage(err));
      // 입력 복구
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("채팅방을 초기화할까요?")) return;
    setLoading(true);
    setError("");
    try {
      await chatApi.resetChatRoom();
      setMessages([]);
      setPage(0);
      setHasMore(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setLoading(true);
    setError("");
    try {
      await fetchMessages(next);
      setPage(next);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <Header />
        <main className="chat-page">
          <div className="chat-card">
            <h2 className="chat-title">실시간 상담</h2>
            <p className="chat-muted">로그인이 필요합니다.</p>
            <div className="chat-actions">
              <button className="chat-btn ghost" onClick={() => navigate("/")}>홈</button>
              <button className="chat-btn" onClick={() => navigate("/login")}>로그인</button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="chat-page">
        <section className="chat-card">
          <div className="chat-header">
            <h2 className="chat-title">실시간 상담</h2>
            <div className="chat-header-actions">
              <button className="chat-btn ghost" onClick={handleReset} disabled={loading || sending}>
                초기화
              </button>
            </div>
          </div>

          {error && <p className="chat-error">{error}</p>}

          <div className="chat-messages" aria-busy={loading}>
            {hasMore && (
              <div className="chat-loadmore">
                <button className="chat-btn ghost" onClick={handleLoadMore} disabled={loading}>
                  이전 메시지 더 보기
                </button>
              </div>
            )}

            {loading && sortedMessages.length === 0 ? (
              <p className="chat-muted">불러오는 중...</p>
            ) : sortedMessages.length === 0 ? (
              <p className="chat-muted">첫 메시지를 보내보세요.</p>
            ) : (
              sortedMessages.map((m) => (
                <div
                  key={m.id}
                  className={m.fromUser ? "chat-bubble user" : "chat-bubble bot"}
                >
                  <div className="chat-bubble-content">{m.content}</div>
                  {m.createdAt && (
                    <div className="chat-bubble-time">
                      {formatKo(m.createdAt)}
                    </div>
                  )}
                </div>
              ))
            )}

            <div ref={bottomRef} />
          </div>

          <form className="chat-inputbar" onSubmit={handleSend}>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요"
              disabled={sending}
            />
            <button className="chat-btn" type="submit" disabled={sending || !input.trim()}>
              {sending ? "전송중" : "전송"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
