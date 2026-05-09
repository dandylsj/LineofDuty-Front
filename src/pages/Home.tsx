import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/userAuth';
import { useEffect, useState } from 'react';
import { userApi } from '../api/userApi';
import { weatherApi } from '../api/weatherApi';
import { enlistmentApi } from '../api/enlistmentApi';
import { noticeApi } from '../api/noticeApi';
import '../styles/home.css';

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

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, userId } = useAuth();
  const [detailedUserInfo, setDetailedUserInfo] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [thisWeekSchedules, setThisWeekSchedules] = useState<any>(null);
  const [thisWeekLoading, setThisWeekLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
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

  const handleSearch = () => {
    const q = searchKeyword.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const getProfileImageUrl = (profile: any): string | null => {
    const candidate = profile?.profileImageUrl;
    if (typeof candidate !== 'string') return null;
    const trimmed = candidate.trim();
    return trimmed ? trimmed : null;
  };

  const profileImageUrl = getProfileImageUrl(detailedUserInfo);
  const avatarFallbackText = (() => {
    const name =
      typeof detailedUserInfo?.username === 'string'
        ? detailedUserInfo.username.trim()
        : '';
    return name ? name.slice(0, 1) : 'U';
  })();

  const thisWeekList: any[] = (() => {
    const data = thisWeekSchedules;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.enlistmentResponse)) return data.enlistmentResponse;
    if (data?.enlistmentResponse && typeof data.enlistmentResponse === 'object')
      return [data.enlistmentResponse];
    if (Array.isArray(data?.content)) return data.content;
    return [];
  })();

  const visibleThisWeekList = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parseDate = (value?: string): Date | null => {
      if (!value || typeof value !== 'string') return null;
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

  const greetingName =
    isLoggedIn && detailedUserInfo
      ? `${detailedUserInfo.username} 님, 환영합니다`
      : '병무청에 오신 것을 환영합니다';

  return (
    <div className="home-page">
      <Header />

      {/* Hero */}
      <section className="home-hero">
        <p className="home-hero__greeting">MILITARY MANPOWER ADMINISTRATION</p>
        <h1 className="home-hero__title">
          {isLoggedIn && detailedUserInfo && (
            <span className="home-hero__avatar-wrap">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="프로필"
                  className="home-hero__avatar-img"
                  loading="lazy"
                />
              ) : (
                <span className="home-hero__avatar-fallback">
                  {avatarFallbackText}
                </span>
              )}
            </span>
          )}
          {greetingName}
        </h1>

        <div className="home-search">
          <input
            className="home-searchInput"
            placeholder="입영 일정, 공지사항, 군장용품 등을 검색해보세요"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <button className="home-searchBtn" onClick={handleSearch}>
            검색
          </button>
        </div>
      </section>

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
                    {notices.map((notice: any) => (
                      <tr
                        key={notice.id}
                        onClick={() => navigate(`/notices/${notice.id}`)}
                      >
                        <td className="notice-title-cell">{notice.title}</td>
                        <td className="notice-date-cell">
                          {new Date(notice.createdAt).toLocaleDateString(
                            'ko-KR',
                          )}
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
                  {visibleThisWeekList.map((schedule: any, index: number) => (
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
                          {schedule.enlistmentDate ??
                            schedule.date ??
                            '날짜 미정'}
                        </div>
                        {schedule.weather && (
                          <div className="home-scheduleItem__sub">
                            {schedule.weather.temp}° ·{' '}
                            {schedule.weather.description}
                          </div>
                        )}
                      </div>
                      <div className="home-scheduleItem__slots">
                        잔여{' '}
                        {schedule.remainingSlots ?? schedule.remaining ?? 0}명
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
                    <span className="home-userInfo__value">
                      {detailedUserInfo.username}
                    </span>
                  </div>
                  <div className="home-userInfo__row">
                    <span className="home-userInfo__label">이메일</span>
                    <span
                      className="home-userInfo__value"
                      style={{ fontSize: 12 }}
                    >
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
              <button
                className="home-chatBtn"
                onClick={() => navigate('/chat')}
              >
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
              <button
                className="home-shopBtn"
                onClick={() => navigate('/products')}
              >
                상품 보러가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
