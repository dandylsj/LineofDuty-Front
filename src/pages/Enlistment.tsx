import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import "../styles/enlistment.css";
import { enlistmentApi } from "../api/enlistmentApi";
import {
  ChevronLeft, ChevronRight, CalendarDays, Users, AlertCircle,
  CheckCircle2, Circle, ClipboardList, Shield, MapPin, Backpack,
} from "lucide-react";

/* ── Types ── */
type Schedule = {
  scheduleId: number;
  enlistmentDate: string | Date;
  remainingSlots: number;
};

/* ── Date Utils ── */
function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

/* ── 입영 절차 단계 ── */
const PROCESS_STEPS = [
  { icon: CalendarDays, title: "날짜 선택",    desc: "희망 입영 날짜를\n캘린더에서 선택" },
  { icon: ClipboardList, title: "입영 신청",   desc: "신청 버튼 클릭 후\n접수 완료" },
  { icon: CheckCircle2, title: "신청 확인",    desc: "마이페이지에서\n신청 내역 확인" },
  { icon: Backpack,     title: "입영 준비",    desc: "준비물 체크리스트로\n꼼꼼히 준비" },
  { icon: Shield,       title: "입영 당일",    desc: "훈련소 도착 후\n신분증 제출" },
];

/* ── 준비물 목록 ── */
const CHECKLIST_ITEMS = [
  { id: "id",      label: "신분증 (주민등록증/운전면허증)",  category: "필수" },
  { id: "doc",     label: "입영통지서 (출력 또는 모바일)",   category: "필수" },
  { id: "money",   label: "현금 (소액, 최초 생활 준비용)",   category: "필수" },
  { id: "phone",   label: "휴대폰 + 충전기",                 category: "전자기기" },
  { id: "wash",    label: "세면도구 (치약·칫솔·면도기)",     category: "위생" },
  { id: "towel",   label: "수건 2~3장",                      category: "위생" },
  { id: "clothes", label: "속옷·양말 3~5벌",                 category: "의류" },
  { id: "meds",    label: "상비약 (개인 복용약 포함)",        category: "건강" },
  { id: "glasses", label: "안경/렌즈 + 세척액",              category: "건강" },
  { id: "book",    label: "개인 서적 1~2권",                 category: "기타" },
];

/* ── 준비물 체크리스트 컴포넌트 ── */
function ChecklistSection() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("enlist_checklist") ?? "[]")); }
    catch { return new Set(); }
  });

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("enlist_checklist", JSON.stringify([...next]));
      return next;
    });
  };

  const pct = Math.round((checked.size / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="el-checklist-wrap">
      <div className="el-checklist-header">
        <div>
          <h3 className="el-section-title">
            <Backpack size={16} color="#0050a0" />
            입영 준비물 체크리스트
          </h3>
          <p className="el-section-sub">항목을 클릭해 체크하세요. 브라우저에 자동 저장됩니다.</p>
        </div>
        <div className="el-checklist-progress">
          <span className="el-prog-num">{checked.size}<span>/{CHECKLIST_ITEMS.length}</span></span>
          <div className="el-prog-bar"><div className="el-prog-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <div className="el-checklist-grid">
        {CHECKLIST_ITEMS.map((item) => {
          const done = checked.has(item.id);
          return (
            <button
              key={item.id}
              className={`el-check-item${done ? " el-check-item--done" : ""}`}
              onClick={() => toggle(item.id)}
            >
              <span className="el-check-icon">
                {done
                  ? <CheckCircle2 size={18} color="#15803d" strokeWidth={2} />
                  : <Circle size={18} color="#d1d5db" strokeWidth={1.5} />
                }
              </span>
              <span className="el-check-label">{item.label}</span>
              <span className="el-check-cat">{item.category}</span>
            </button>
          );
        })}
      </div>

      {pct === 100 && (
        <div className="el-checklist-done">
          <Shield size={18} color="#15803d" />
          모든 준비물을 확인했습니다! 입영 준비 완료 🎖️
        </div>
      )}
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export default function Enlistment() {
  const today = new Date();

  const [viewMonth, setViewMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(toYMD(today));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await enlistmentApi.getEnlistmentList(0, 100);
      let data = res.data?.data || res.data?.content || res.data || [];
      if (!Array.isArray(data) && typeof data === "object") {
        if (data.content && Array.isArray(data.content)) data = data.content;
      }
      setSchedules(Array.isArray(data) ? data : []);
    } catch { setSchedules([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, []);

  /* ── scheduleMap ── */
  const scheduleMap = useMemo(() => {
    const m = new Map<string, Schedule>();
    schedules.forEach((s) => {
      let dateStr = "";
      if (typeof s.enlistmentDate === "string") dateStr = s.enlistmentDate;
      else if (s.enlistmentDate instanceof Date) dateStr = toYMD(s.enlistmentDate);
      else if (Array.isArray(s.enlistmentDate)) {
        const [y, mo, d] = s.enlistmentDate as any[];
        dateStr = `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      }
      if (dateStr) m.set(dateStr, { ...s, enlistmentDate: dateStr } as Schedule);
    });
    return m;
  }, [schedules]);

  /* ── 달력 셀 ── */
  const days = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const last  = endOfMonth(viewMonth);
    const cells: Array<{ date?: string; day?: number }> = [];
    for (let i = 0; i < first.getDay(); i++) cells.push({});
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ date: toYMD(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d)), day: d });
    }
    while (cells.length < 42) cells.push({});
    return cells;
  }, [viewMonth]);

  /* ── 통계 (현재 보는 달 기준) ── */
  const stats = useMemo(() => {
    const monthStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, "0")}`;
    const monthSchedules = [...scheduleMap.values()].filter(
      (s) => (s.enlistmentDate as string).startsWith(monthStr)
    );
    return {
      total: monthSchedules.length,
      available: monthSchedules.filter((s) => s.remainingSlots > 0).length,
      closing: monthSchedules.filter((s) => s.remainingSlots > 0 && s.remainingSlots <= 10).length,
    };
  }, [scheduleMap, viewMonth]);

  const selectedSchedule = scheduleMap.get(selectedDate);

  /* ── 신청 ── */
  const handleApply = async () => {
    if (!selectedSchedule) { alert("해당 날짜에는 입영 일정이 없습니다."); return; }
    if (selectedSchedule.remainingSlots <= 0) { alert("잔여 인원이 없습니다."); return; }
    try {
      setApplying(true);
      await enlistmentApi.applyEnlistment({ scheduleId: selectedSchedule.scheduleId });
      alert("입영 신청이 완료되었습니다.");
      await fetchSchedules();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "입영 신청 중 오류가 발생했습니다.");
    } finally { setApplying(false); }
  };

  /* ── 선택 날짜 포맷 ── */
  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const weekday = ["일","월","화","수","목","금","토"][selectedDateObj.getDay()];
  const formattedDate = `${selectedDateObj.getFullYear()}년 ${selectedDateObj.getMonth() + 1}월 ${selectedDateObj.getDate()}일 (${weekday})`;

  const slotColor = (n: number) =>
    n <= 0 ? "#9ca3af" : n <= 10 ? "#b91c1c" : n <= 30 ? "#b45309" : "#15803d";

  return (
    <>
      <Header />

      <div className="el-page">

        {/* ── 히어로 배너 ── */}
        <div className="el-hero">
          <div className="el-hero-inner">
            <div className="el-hero-badge">
              <Shield size={13} />
              대한민국 육군
            </div>
            <h1 className="el-hero-title">입영 일정 신청</h1>
            <p className="el-hero-sub">
              희망하는 입영 날짜를 선택하고 신청하세요.<br />
              공정한 추첨을 통해 배정됩니다.
            </p>
            <div className="el-hero-tags">
              <span><MapPin size={12} /> 충남 논산 육군훈련소</span>
              <span><CalendarDays size={12} /> 매월 정기 모집</span>
              <span><Users size={12} /> 선착순·추첨 병행</span>
            </div>
          </div>
          <div className="el-hero-deco">
            <Shield size={120} color="rgba(255,255,255,0.07)" strokeWidth={0.8} />
          </div>
        </div>

        <div className="el-container">

          {/* ── 통계 카드 ── */}
          <div className="el-stats-row">
            <div className="el-stat-card">
              <CalendarDays size={22} color="#0050a0" strokeWidth={1.5} />
              <div>
                <p className="el-stat-num">{loading ? "—" : stats.total}<span>개</span></p>
                <p className="el-stat-label">이번달 입영 일정</p>
              </div>
            </div>
            <div className="el-stat-card el-stat-card--green">
              <Users size={22} color="#15803d" strokeWidth={1.5} />
              <div>
                <p className="el-stat-num" style={{ color: "#15803d" }}>{loading ? "—" : stats.available}<span>일</span></p>
                <p className="el-stat-label">신청 가능 날짜</p>
              </div>
            </div>
            <div className="el-stat-card el-stat-card--red">
              <AlertCircle size={22} color="#b91c1c" strokeWidth={1.5} />
              <div>
                <p className="el-stat-num" style={{ color: "#b91c1c" }}>{loading ? "—" : stats.closing}<span>일</span></p>
                <p className="el-stat-label">마감 임박 (잔여 10↓)</p>
              </div>
            </div>
          </div>

          {/* ── 달력 + 상세 ── */}
          <div className="el-main-grid">

            {/* 달력 */}
            <div className="el-card">
              <div className="el-cal-header">
                <button className="el-nav-btn" onClick={() => setViewMonth(addMonths(viewMonth, -1))}>
                  <ChevronLeft size={18} />
                </button>
                <h2 className="el-month-title">
                  {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
                </h2>
                <button className="el-nav-btn" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="el-weekdays">
                {["일","월","화","수","목","금","토"].map((w, i) => (
                  <div key={w} className={`el-weekday${i === 0 ? " el-weekday--sun" : i === 6 ? " el-weekday--sat" : ""}`}>{w}</div>
                ))}
              </div>

              <div className="el-cal-grid">
                {days.map((cell, idx) => {
                  if (!cell.date) return <div key={idx} className="el-day el-day--empty" />;
                  const sch       = scheduleMap.get(cell.date);
                  const isSelected = cell.date === selectedDate;
                  const isToday    = cell.date === toYMD(today);
                  const isSun      = new Date(cell.date + "T00:00:00").getDay() === 0;
                  const isSat      = new Date(cell.date + "T00:00:00").getDay() === 6;
                  const soldout    = sch && sch.remainingSlots <= 0;
                  return (
                    <button
                      key={cell.date}
                      className={[
                        "el-day",
                        isSelected && "el-day--selected",
                        isToday    && "el-day--today",
                        sch        && "el-day--has",
                        soldout    && "el-day--soldout",
                        isSun      && "el-day--sun",
                        isSat      && "el-day--sat",
                      ].filter(Boolean).join(" ")}
                      onClick={() => setSelectedDate(cell.date!)}
                    >
                      <span className="el-day-num">{cell.day}</span>
                      {sch && (
                        <span
                          className="el-day-badge"
                          style={{ background: soldout ? "#f3f4f6" : "#ecfdf5", color: soldout ? "#9ca3af" : slotColor(sch.remainingSlots) }}
                        >
                          {soldout ? "마감" : `${sch.remainingSlots}명`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 범례 */}
              <div className="el-legend">
                <span className="el-legend-item"><span className="el-dot el-dot--has" />일정 있음</span>
                <span className="el-legend-item"><span className="el-dot el-dot--soldout" />마감</span>
                <span className="el-legend-item"><span className="el-dot el-dot--today" />오늘</span>
                <span className="el-legend-item"><span className="el-dot el-dot--selected" />선택</span>
              </div>
            </div>

            {/* 상세 패널 */}
            <div className="el-detail-panel">

              {/* 선택 날짜 정보 */}
              <div className="el-card el-detail-card">
                <h3 className="el-detail-heading">선택한 날짜</h3>
                <div className="el-detail-date">{formattedDate}</div>

                {selectedSchedule ? (
                  <>
                    <div className="el-detail-status el-detail-status--available">
                      <CheckCircle2 size={14} />
                      입영 신청 가능
                    </div>
                    <div className="el-slots-wrap">
                      <div className="el-slots-bar-bg">
                        <div
                          className="el-slots-bar-fill"
                          style={{
                            width: `${Math.min(100, (selectedSchedule.remainingSlots / 200) * 100)}%`,
                            background: slotColor(selectedSchedule.remainingSlots),
                          }}
                        />
                      </div>
                      <div className="el-slots-info">
                        <span>잔여 인원</span>
                        <strong style={{ color: slotColor(selectedSchedule.remainingSlots) }}>
                          {selectedSchedule.remainingSlots}명
                        </strong>
                      </div>
                    </div>
                    {selectedSchedule.remainingSlots <= 10 && selectedSchedule.remainingSlots > 0 && (
                      <p className="el-slots-warning">
                        <AlertCircle size={13} /> 잔여 인원이 얼마 남지 않았습니다!
                      </p>
                    )}
                    <button className="el-apply-btn" onClick={handleApply} disabled={applying}>
                      {applying ? "신청 중..." : "이 날짜로 입영 신청하기"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="el-detail-status el-detail-status--none">
                      <Circle size={14} />
                      이 날짜에는 입영 일정이 없습니다
                    </div>
                    <p className="el-detail-hint">달력에서 파란 날짜를 선택하세요</p>
                    <button className="el-apply-btn el-apply-btn--disabled" disabled>
                      신청 불가
                    </button>
                  </>
                )}
              </div>

              {/* 유의사항 */}
              <div className="el-card el-notice-card">
                <h3 className="el-detail-heading">신청 유의사항</h3>
                <ul className="el-notice-list">
                  <li>입영 신청 후 취소는 마이페이지에서 가능합니다.</li>
                  <li>잔여 인원 소진 시 신청이 마감됩니다.</li>
                  <li>입영일 기준 7일 전까지 취소 가능합니다.</li>
                  <li>연기 신청은 별도 연기 신청 메뉴를 이용하세요.</li>
                  <li>문의: 육군훈련소 ☎ 041-730-1234</li>
                </ul>
              </div>

            </div>
          </div>

          {/* ── 입영 절차 ── */}
          <div className="el-card el-process-card">
            <h3 className="el-section-title">
              <ClipboardList size={16} color="#0050a0" />
              입영 신청 절차
            </h3>
            <div className="el-process-steps">
              {PROCESS_STEPS.map((step, i) => (
                <div key={i} className="el-step">
                  <div className="el-step-num">{i + 1}</div>
                  <div className="el-step-icon">
                    <step.icon size={22} color="#0050a0" strokeWidth={1.5} />
                  </div>
                  <p className="el-step-title">{step.title}</p>
                  <p className="el-step-desc">{step.desc}</p>
                  {i < PROCESS_STEPS.length - 1 && <div className="el-step-arrow" />}
                </div>
              ))}
            </div>
          </div>

          {/* ── 준비물 체크리스트 ── */}
          <div className="el-card">
            <ChecklistSection />
          </div>

        </div>
      </div>
    </>
  );
}
