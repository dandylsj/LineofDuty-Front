import Header from "../components/Header";
import React, { useEffect, useMemo, useState } from "react";
import { qnaApi } from "../api/qnaApi";
import "../styles/qna.css";
import { useAuth } from "../hooks/userAuth";

interface Qna {
  id: number;
  title: string;
  questionContent: string;
  askContent?: string;
  userId: number;
  createdAt: string;
  modifiedAt: string;
  status: string;
  viewCount: number;
}

const QnA: React.FC = () => {
  const { isAdmin, isLoggedIn, isInitialized, userId } = useAuth();
  const [qnaList, setQnaList] = useState<Qna[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedQna, setSelectedQna] = useState<Qna | null>(null);
  const [answerText, setAnswerText] = useState("");

  const formatDate = useMemo(
    () => (value?: string) => {
      if (!value) return "-";
      const t = Date.parse(value);
      if (Number.isNaN(t)) return value;
      return new Date(t).toLocaleDateString("ko-KR");
    },
    []
  );

  useEffect(() => {
    if (!isInitialized) return;
    fetchQnaList();
  }, [isInitialized]);

  const fetchQnaList = async () => {
    setLoading(true);
    try {
      const res = await qnaApi.getQnaList();
      setQnaList(res.data.data.content || []);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!newQuestion.trim() || !userId) return;
    try {
      await qnaApi.registerQna(userId, { title: "질문", questionContent: newQuestion });
      setShowModal(false);
      setNewQuestion("");
      fetchQnaList();
    } catch (e) {}
  };

  const handleAnswer = async () => {
    if (!selectedQna || !answerText.trim()) return;
    try {
      await qnaApi.answerQna(selectedQna.id, { askContent: answerText });
      setSelectedQna(null);
      setAnswerText("");
      fetchQnaList();
    } catch (e) {}
  };

  const handleDelete = async (id: number) => {
    try {
      await qnaApi.deleteQna(id);
      fetchQnaList();
    } catch (e) {}
  };

  return (
    <>
      <Header />
      <main className="qna-page">
        <div className="qna-wrapper">
          <div className="qna-header">
            <h2 className="qna-title">QnA 게시판</h2>

            {isLoggedIn && (
              <button
                className="qna-btn qna-btn--primary"
                onClick={() => setShowModal(true)}
              >
                질문 등록
              </button>
            )}
          </div>

          {loading ? (
            <div className="qna-state">로딩 중...</div>
          ) : qnaList.length > 0 ? (
            <div className="qna-list">
              {qnaList.map((qna) => (
                <div key={qna.id} className="qna-item">
                  <div className="qna-item__top">
                    <div className="qna-item__meta">
                      <span className="qna-item__author">작성자 {qna.userId}</span>
                      <span className="qna-item__dot">·</span>
                      <span className="qna-item__date">{formatDate(qna.createdAt)}</span>
                    </div>

                    {isAdmin && (
                      <div className="qna-item__actions">
                        {!qna.askContent && (
                          <button
                            className="qna-btn qna-btn--primary"
                            onClick={() => {
                              setSelectedQna(qna);
                              setAnswerText("");
                            }}
                          >
                            답변하기
                          </button>
                        )}
                        <button
                          className="qna-btn qna-btn--danger"
                          onClick={() => handleDelete(qna.id)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="qna-item__body">
                    <p className="qna-item__question">{qna.questionContent}</p>

                    {qna.askContent && (
                      <div className="qna-answer">
                        <div className="qna-answer__label">답변</div>
                        <div className="qna-answer__content">{qna.askContent}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="qna-state">등록된 질문이 없습니다.</div>
          )}

          {/* 질문 등록 모달 */}
          {showModal && (
            <div className="qna-modal" onClick={() => setShowModal(false)}>
              <div className="qna-modal__content" onClick={(e) => e.stopPropagation()}>
                <h3 className="qna-modal__title">질문 등록</h3>
                <textarea
                  className="qna-textarea"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="질문 내용을 입력해주세요"
                />
                <div className="qna-modal__actions">
                  <button className="qna-btn qna-btn--ghost" onClick={() => setShowModal(false)}>
                    취소
                  </button>
                  <button
                    className="qna-btn qna-btn--primary"
                    onClick={handleRegister}
                    disabled={!newQuestion.trim()}
                  >
                    등록
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 답변 모달 (관리자만) */}
          {selectedQna && isAdmin && (
            <div className="qna-modal" onClick={() => setSelectedQna(null)}>
              <div className="qna-modal__content" onClick={(e) => e.stopPropagation()}>
                <h3 className="qna-modal__title">답변 작성</h3>
                <div className="qna-modal__hint">
                  <div className="qna-modal__hintLabel">질문</div>
                  <div className="qna-modal__hintText">{selectedQna.questionContent}</div>
                </div>
                <textarea
                  className="qna-textarea"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="답변 내용을 입력해주세요"
                />
                <div className="qna-modal__actions">
                  <button className="qna-btn qna-btn--ghost" onClick={() => setSelectedQna(null)}>
                    취소
                  </button>
                  <button
                    className="qna-btn qna-btn--primary"
                    onClick={handleAnswer}
                    disabled={!answerText.trim()}
                  >
                    답변 등록
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default QnA;
