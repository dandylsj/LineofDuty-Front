import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import "../styles/enlistment.css";
import { enlistmentApi } from "../api/enlistmentApi";

/* =====================
   Types (API 기준)
===================== */
type Schedule = {
  scheduleId: number;
  enlistmentDate: string | Date; // YYYY-MM-DD 또는 Date 객체
  remainingSlots: number;
};

/* =====================
   Date Utils
===================== */
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, diff: number) {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}

/* =====================
   Component
===================== */
export default function Enlistment() {
  const today = new Date();

  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(toYMD(today));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  /* =====================
     API: 일정 조회
  ===================== */
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await enlistmentApi.getEnlistmentList(0, 100);
      
      // 응답 데이터 구조 확인 후 처리
      let data = res.data?.data || res.data?.content || res.data || [];
      
      // 만약 data가 객체라면 그 안의 배열을 찾아보기
      if (!Array.isArray(data) && typeof data === "object") {
        // content 필드 확인
        if (data.content && Array.isArray(data.content)) {
          data = data.content;
        }
      }
      
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        setSchedules([]);
      }
    } catch (e: any) {
      if (e?.response?.data?.message) {
        alert(`오류: ${e.response.data.message}`);
      } else {
        alert("입영 일정을 불러오지 못했습니다. 백엔드를 확인하세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  /* =====================
     Calendar Map
  ===================== */
  const scheduleMap = useMemo(() => {
    const m = new Map<string, Schedule>();
    schedules.forEach((s) => {
      // enlistmentDate를 문자열로 정규화
      let dateStr: string;
      if (typeof s.enlistmentDate === "string") {
        dateStr = s.enlistmentDate;
      } else if (s.enlistmentDate instanceof Date) {
        dateStr = toYMD(s.enlistmentDate);
      } else if (Array.isArray(s.enlistmentDate)) {
        // [year, month, day] 형식 대응 (혹시모르니)
        const arr = s.enlistmentDate as any[];
        const [y, m, d] = arr;
        dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      } else {
        dateStr = "";
      }
      if (dateStr) {
        m.set(dateStr, { ...s, enlistmentDate: dateStr } as Schedule);
      }
    });
    return m;
  }, [schedules]);

  const days = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);

    const startPad = first.getDay();
    const totalDays = last.getDate();

    const cells: Array<{ date?: string; day?: number }> = [];

    for (let i = 0; i < startPad; i++) cells.push({});

    for (let d = 1; d <= totalDays; d++) {
      const cur = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      cells.push({ date: toYMD(cur), day: d });
    }

    while (cells.length < 42) cells.push({});
    return cells;
  }, [viewMonth]);

  const selectedSchedule = scheduleMap.get(selectedDate);

  /* =====================
     신청
  ===================== */
  const handleApply = async () => {
    if (!selectedSchedule) {
      alert("해당 날짜에는 입영 일정이 없습니다.");
      return;
    }

    if (selectedSchedule.remainingSlots <= 0) {
      alert("잔여 인원이 없습니다.");
      return;
    }

    try {
      await enlistmentApi.applyEnlistment({
        scheduleId: selectedSchedule.scheduleId,
      });

      alert("입영 신청이 완료되었습니다.");
      await fetchSchedules();
    } catch (e: any) {
      alert(
        e?.response?.data?.message ??
          "입영 신청 중 오류가 발생했습니다."
      );
    }
  };

  /* =====================
     Render
  ===================== */
  if (loading) {
    return (
      <>
        <Header />
        <main className="enlistment-page">
          <p>입영 일정을 불러오는 중입니다...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="enlistment-page">
        <div className="enlistment-layout">
          {/* ===== 달력 ===== */}
          <section className="card">
            <div className="calendar-header">
              <button
                className="icon-btn"
                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              >
                ◀
              </button>

              <h2 className="month-title">
                {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
              </h2>

              <button
                className="icon-btn"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              >
                ▶
              </button>
            </div>

            <div className="weekdays">
              {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
                <div key={w} className="weekday">
                  {w}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {days.map((cell, idx) => {
                if (!cell.date) {
                  return <div key={idx} className="day empty" />;
                }

                const sch = scheduleMap.get(cell.date);
                const isSelected = cell.date === selectedDate;
                const isToday = cell.date === toYMD(today);

                return (
                  <button
                    key={cell.date}
                    className={[
                      "day",
                      isSelected && "selected",
                      isToday && "today",
                      sch && "has-schedule",
                      sch && sch.remainingSlots <= 0 && "soldout",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedDate(cell.date!)}
                  >
                    <div className="day-num">{cell.day}</div>
                    {sch && (
                      <div className="badge">
                        {sch.remainingSlots > 0 ? (
                          <>
                            <span className="badge-label">잔여</span>
                            <span className="badge-num">{sch.remainingSlots}</span>
                          </>
                        ) : (
                          "마감"
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ===== 상세 ===== */}
          <section className="card">
            <h3 className="section-title">선택 날짜</h3>

            <div className="selected-box">
              <div className="selected-date">{selectedDate}</div>

              {selectedSchedule ? (
                <div className="selected-info">
                  <div>잔여 인원: {selectedSchedule.remainingSlots}</div>
                </div>
              ) : (
                <div className="selected-info muted">
                  이 날짜에는 입영 일정이 없습니다.
                </div>
              )}

              <button className="primary-btn" onClick={handleApply}>
                이 날짜로 입영 신청
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
