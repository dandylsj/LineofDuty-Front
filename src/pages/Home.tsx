import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/userAuth';
import { useEffect, useState, useCallback } from 'react';
import { userApi } from '../api/userApi';
import { weatherApi } from '../api/weatherApi';
import { enlistmentApi } from '../api/enlistmentApi';
import { noticeApi } from '../api/noticeApi';
import { bannerApi } from '../api/bannerApi';
import type { BannerResponse } from '../api/bannerApi';
import '../styles/home.css';

interface UserInfo {
  username: string;
  email: string;
  profileImageUrl?: string;
}

interface WeatherInfo {
  temperature?: number;
  temp?: number;
  skyStatus?: string;
  description?: string;
}

interface ScheduleItem {
  scheduleId?: number;
  scheduledId?: number;
  id?: number;
  enlistmentDate?: string;
  date?: string;
  remainingSlots?: number;
  remaining?: number;
  weather?: { temp: number; description: string };
}

interface ScheduleData {
  enlistmentResponse?: ScheduleItem | ScheduleItem[];
  content?: ScheduleItem[];
}

interface NoticeItem {
  id: number;
  title: string;
  createdAt: string;
}

const QUICK_SERVICES = [
  { icon: '📋', label: '입영 일정 조회', path: '/enlistment' },
  { icon: '📝', label: '연기 신청', path: '/deferments' },
  { icon: '🛒', label: '군장용품 구매', path: '/products' },
  { icon: '📢', label: '공지사항', path: '/notices' },
  { icon: '💬', label: 'QnA / 민원', path: '/qna' },
  { icon: '🤖', label: '실시간 상담', path: '/chat' },
  { icon: '👤', label: '마이페이지', path: '/mypage' },
  { icon: '🛍️', label: '장바구니', path: '/cart' },
  { icon: '📦', label: '주문내역', path: '/orders' },
  { icon: '🔍', label: '통합 검색', path: '/search' },
];

// 배너 API 응답이 없을 때 보여줄 폴백 데이터
const FALLBACK_BANNERS: BannerResponse[] = [
  {
    id: 0,
    badge: '2026 입영 안내',
    title: '대한민국 국방의 의무',
    subtitle: '입영 일정부터 준비물까지\n병무청이 함께합니다',
    ctaText: '입영 일정 확인하기',
    ctaPath: '/enlistment',
    imageUrl: null,
    accentColor: '#C8102E',
    orderIndex: 0,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 1,
    badge: '군장용품 특가',
    title: '입영 준비, 이제 한 곳에서',
    subtitle: '군복·군화·생활용품까지\n최저가로 한번에 준비하세요',
    ctaText: '상품 보러가기',
    ctaPath: '/products',
    imageUrl: null,
    accentColor: '#4CAF50',
    orderIndex: 1,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    badge: 'AI 실시간 상담',
    title: '병역 Q&A, 24시간 AI 상담',
    subtitle: '언제든지 병역 관련 궁금증을\nAI에게 바로 물어보세요',
    ctaText: '상담 시작하기',
    ctaPath: '/chat',
    imageUrl: null,
    accentColor: '#7c4dff',
    orderIndex: 2,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
];

const BG_GRADIENTS = [
  'linear-gradient(120deg, #001a4d 0%, #003087 50%, #0050A0 100%)',
  'linear-gradient(120deg, #0d2b0d 0%, #1e5c1a 50%, #2d7a27 100%)',
  'linear-gradient(120deg, #0d0d2e 0%, #1a1a6a 50%, #2a2a99 100%)',
  'linear-gradient(120deg, #2a1500 0%, #5c3200 50%, #8a4c00 100%)',
  'linear-gradient(120deg, #1a0033 0%, #3d0075 50%, #5a00aa 100%)',
];

function BannerCarousel() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [banners, setBanners] = useState<BannerResponse[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bannerApi.getActiveBanners();
        const data: BannerResponse[] = res.data?.data ?? [];
        setBanners(data.length > 0 ? data : FALLBACK_BANNERS);
      } catch {
        setBanners(FALLBACK_BANNERS);
      }
    };
    void load();
  }, []);

  const total = banners.length;

  const goTo = useCallback((index: number) => {
    if (isAnimating || total === 0) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, total]);

  const prev = () => goTo((current - 1 + total) % total);
  const next = useCallback(() => goTo((current + 1) % total), [current, goTo, total]);

  useEffect(() => {
    if (total === 0) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, total]);

  if (total === 0) return <div className="banner-carousel banner-carousel--loading" />;

  const banner = banners[current];
  const accent = banner.accentColor || '#C8102E';
  const bg = banner.imageUrl
    ? `url(${banner.imageUrl}) center/cover no-repeat`
    : BG_GRADIENTS[current % BG_GRADIENTS.length];

  return (
    <div className="banner-carousel">
      <div className="banner-slide" style={{ background: bg }} key={current}>
        <div className="banner-content">
          <div
            className="banner-badge"
            style={{ borderColor: accent, color: accent }}
          >
            {banner.badge}
          </div>
          <h2 className="banner-title">{banner.title}</h2>
          <p className="banner-subtitle">
            {(banner.subtitle || '').split('\n').map((line: string, i: number) => (
              <span key={`subtitle-${i}`}>{line}{i === 0 && <br />}</span>
            ))}
          </p>
          <button
            className="banner-cta"
            style={{ background: accent }}
            onClick={() => navigate(banner.ctaPath || '/')}
          >
            {banner.ctaText || '자세히 보기'} →
          </button>
        </div>

        {/* 이미지가 없을 때만 장식 원 표시 */}
        {!banner.imageUrl && (
          <div className="banner-deco">
            <div className="banner-deco__ring banner-deco__ring--1" />
            <div className="banner-deco__ring banner-deco__ring--2" />
            <div className="banner-deco__ring banner-deco__ring--3" />
          </div>
        )}

        {/* 이미지 있을 때 어두운 오버레이 */}
        {banner.imageUrl && <div className="banner-overlay" />}
      </div>

      <button className="banner-arrow banner-arrow--left" onClick={prev} aria-label="이전">‹</button>
      <button className="banner-arrow banner-arrow--right" onClick={next} aria-label="다음">›</button>

      <div className="banner-dots">
        {banners.map((banner, i) => (
          <button
            key={`dot-${banner.id}-${i}`}
            className={`banner-dot${i === current ? ' banner-dot--active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`슬라이드 ${i + 1}`}
          />
        ))}
      </div>

      <div className="banner-progress">
        <div
          className="banner-progress__bar"
          style={{ background: accent }}
          key={`${current}-progress`}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, userId } = useAuth();
  const [detailedUserInfo, setDetailedUserInfo] = useState<UserInfo | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [thisWeekSchedules, setThisWeekSchedules] = useState<ScheduleItem[] | ScheduleData | null>(null);
  const [thisWeekLoading, setThisWeekLoading] = useState(true);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const NX = 36;
  const NY = 127;

  useEffect(() => {
    if (isLoggedIn && userId) {
      userApi
        .getProfile(userId)
        .then((res) => setDetailedUserInfo(res.data?.data))
        .catch(() => {});
    }
  }, [isLoggedIn, userId]);

  useEffect(() => {
    weatherApi
      .getTodayWeather()
      .then((res) => setWeather(res.data?.data))
      .catch(() => {})
      .finally(() => setWeatherLoading(false));
  }, []);

  useEffect(() => {
    enlistmentApi
      .getThisWeekSummary(NX, NY)
      .then((res) => setThisWeekSchedules(res.data?.data))
      .catch(() => {})
      .finally(() => setThisWeekLoading(false));
  }, []);

  useEffect(() => {
    noticeApi
      .getNoticeList({ page: 0, size: 6 })
      .then((res) => {
        const data = res.data?.data;
        setNotices(Array.isArray(data) ? data : data?.content || []);
      })
      .catch(() => {})
      .finally(() => setNoticesLoading(false));
  }, []);

  const thisWeekList: ScheduleItem[] = (() => {
    const data = thisWeekSchedules;
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    const d = data as ScheduleData;
    if (Array.isArray(d.enlistmentResponse)) return d.enlistmentResponse;
    if (d.enlistmentResponse && typeof d.enlistmentResponse === 'object')
      return [d.enlistmentResponse as ScheduleItem];
    if (Array.isArray(d.content)) return d.content;
    return [];
  })();

  const visibleThisWeekList: ScheduleItem[] = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parseDate = (value?: string): Date | null => {
      if (!value) return null;
      const m = /^\d{4}-\d{2}-\d{2}$/.exec(value.trim());
      if (!m) return null;
      const [y, mo, d] = value.trim().split('-').map(Number);
      return new Date(y, mo - 1, d);
    };
    return thisWeekList.filter((it) => {
      const parsed = parseDate(it?.enlistmentDate ?? it?.date);
      if (!parsed) return true;
      parsed.setHours(0, 0, 0, 0);
      return parsed >= today;
    });
  })();

  return (
    <div className="home-page">
      <Header />

      {/* Wide Banner Carousel */}
      <BannerCarousel />

      {/* Quick Services */}
      <div className="home-quickServices">
        <div className="home-section-header">
          <h2 className="home-section-title">빠른 서비스</h2>
        </div>
        <div className="home-serviceGrid">
          {QUICK_SERVICES.map((svc) => (
            <div
              key={svc.path}
              className="home-serviceCard"
              onClick={() => navigate(svc.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(svc.path);
              }}
            >
              <div className="home-serviceCard__icon">{svc.icon}</div>
              <span className="home-serviceCard__label">{svc.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="home-content">
        {/* Left: notices + schedule */}
        <div className="home-main-col">
          {/* Notices */}
          <div className="home-govCard">
            <div className="home-govCard__header">
              <h3 className="home-govCard__header-title">공지사항</h3>
              <button
                className="home-govCard__header-more"
                onClick={() => navigate('/notices')}
              >
                더보기 ›
              </button>
            </div>
            <div className="home-govCard__body" style={{ padding: 0 }}>
              {noticesLoading ? (
                <p className="home-loading">불러오는 중...</p>
              ) : notices.length > 0 ? (
                <table className="home-noticeTable">
                  <thead>
                    <tr>
                      <th>제목</th>
                      <th style={{ width: 90 }}>등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notices.map((notice) => (
                      <tr
                        key={notice.id}
                        onClick={() => navigate(`/notices/${notice.id}`)}
                      >
                        <td className="notice-title-cell">{notice.title}</td>
                        <td className="notice-date-cell">
                          {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="home-empty">공지사항이 없습니다</p>
              )}
            </div>
          </div>

          {/* This week schedule */}
          <div className="home-govCard">
            <div className="home-govCard__header">
              <h3 className="home-govCard__header-title">이번주 입영 일정</h3>
              <button
                className="home-govCard__header-more"
                onClick={() => navigate('/enlistment')}
              >
                더보기 ›
              </button>
            </div>
            <div className="home-govCard__body">
              {thisWeekLoading ? (
                <p className="home-loading">불러오는 중...</p>
              ) : visibleThisWeekList.length > 0 ? (
                <div className="home-scheduleList">
                  {visibleThisWeekList.map((schedule, index) => (
                    <div
                      key={
                        schedule?.scheduleId ??
                        schedule?.scheduledId ??
                        schedule?.id ??
                        index
                      }
                      className="home-scheduleItem"
                      onClick={() => navigate('/enlistment')}
                    >
                      <div className="home-scheduleItem__badge">입영</div>
                      <div className="home-scheduleItem__info">
                        <div className="home-scheduleItem__date">
                          {schedule.enlistmentDate ?? schedule.date ?? '날짜 미정'}
                        </div>
                        {schedule.weather && (
                          <div className="home-scheduleItem__sub">
                            {schedule.weather.temp}° · {schedule.weather.description}
                          </div>
                        )}
                      </div>
                      <div className="home-scheduleItem__slots">
                        잔여 {schedule.remainingSlots ?? schedule.remaining ?? 0}명
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="home-empty">이번주 입영 일정이 없습니다</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: side cards */}
        <div className="home-side-col">
          {/* Weather */}
          <div className="home-sideCard">
            <div className="home-sideCard__header">
              <h4 className="home-sideCard__header-title">오늘의 날씨</h4>
            </div>
            <div className="home-sideCard__body">
              {weatherLoading ? (
                <p className="home-loading">불러오는 중...</p>
              ) : weather ? (
                <>
                  <div className="home-weather__temp">
                    {weather.temperature ?? weather.temp ?? '--'}°
                  </div>
                  <p className="home-weather__desc">
                    {weather.skyStatus ?? weather.description ?? '정보 없음'}
                  </p>
                </>
              ) : (
                <>
                  <div className="home-weather__temp">--°</div>
                  <p className="home-weather__desc">날씨 정보 없음</p>
                </>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="home-sideCard">
            <div className="home-sideCard__header">
              <h4 className="home-sideCard__header-title">내 정보</h4>
            </div>
            <div className="home-sideCard__body">
              {isLoggedIn && detailedUserInfo ? (
                <>
                  <div className="home-userInfo__row">
                    <span className="home-userInfo__label">이름</span>
                    <span className="home-userInfo__value">{detailedUserInfo.username}</span>
                  </div>
                  <div className="home-userInfo__row">
                    <span className="home-userInfo__label">이메일</span>
                    <span className="home-userInfo__value" style={{ fontSize: 12 }}>
                      {detailedUserInfo.email}
                    </span>
                  </div>
                  <button
                    className="home-shopBtn"
                    onClick={() => navigate('/mypage')}
                  >
                    마이페이지 바로가기
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
                    로그인 후 이용하세요
                  </p>
                  <button
                    className="home-chatBtn"
                    onClick={() => navigate('/login')}
                  >
                    로그인
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="home-sideCard">
            <div className="home-sideCard__header">
              <h4 className="home-sideCard__header-title">실시간 상담</h4>
            </div>
            <div className="home-sideCard__body">
              <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px' }}>
                병역 관련 궁금한 사항을
              </p>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
                AI에게 바로 물어보세요
              </p>
              <button className="home-chatBtn" onClick={() => navigate('/chat')}>
                상담 시작하기
              </button>
            </div>
          </div>

          {/* Shop */}
          <div className="home-sideCard">
            <div className="home-sideCard__header">
              <h4 className="home-sideCard__header-title">군장용품 구매</h4>
            </div>
            <div className="home-sideCard__body">
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
                입영 전 필요한 물품을
                <br />
                미리 준비하세요
              </p>
              <button className="home-shopBtn" onClick={() => navigate('/products')}>
                상품 보러가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
