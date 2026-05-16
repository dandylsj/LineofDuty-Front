import Header from '../components/Header';
import KoreaWeatherMap from '../components/KoreaWeatherMap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/userAuth';
import { useEffect, useState, useCallback } from 'react';
import type { AxiosResponse } from 'axios';
import { userApi } from '../api/userApi';
import { weatherApi } from '../api/weatherApi';
import { noticeApi } from '../api/noticeApi';
import { productApi } from '../api/productApi';
import { bannerApi } from '../api/bannerApi';
import type { BannerResponse } from '../api/bannerApi';
import {
  Trophy, Sparkles, ShoppingCart, Package, Gift,
  Home as HomeIcon, ShoppingBag, ClipboardList, User,
  Bot, MapPin, Sun, Cloud, CloudRain, Snowflake, CloudLightning, CloudSun,
  ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';
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

interface NoticeItem {
  id: number;
  title: string;
  createdAt: string;
}

interface ProductItem {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

const QUICK_ACTIONS = [
  { Icon: Trophy,       label: '베스트',  path: '/products?sort=best' },
  { Icon: Sparkles,     label: '신상품',  path: '/products?sort=new' },
  { Icon: ShoppingCart, label: '장바구니', path: '/cart' },
  { Icon: Package,      label: '주문내역', path: '/orders' },
  { Icon: Gift,         label: '이벤트',  path: '/notices' },
];

const CITIES = [
  { id: 'nonsan',   name: '논산', label: '📍 충남 논산시 연무읍', nx: 36, ny: 127 },
  { id: 'seoul',    name: '서울', label: '📍 서울특별시',         nx: 37, ny: 126 },
  { id: 'incheon',  name: '인천', label: '📍 인천광역시',         nx: 37, ny: 126 },
  { id: 'gyeonggi', name: '경기', label: '📍 경기도',             nx: 37, ny: 127 },
  { id: 'daegu',    name: '대구', label: '📍 대구광역시',         nx: 35, ny: 128 },
  { id: 'daejeon',  name: '대전', label: '📍 대전광역시',         nx: 36, ny: 127 },
  { id: 'busan',    name: '부산', label: '📍 부산광역시',         nx: 35, ny: 129 },
  { id: 'gwangju',  name: '광주', label: '📍 광주광역시',         nx: 35, ny: 126 },
];

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
];

function WeatherIcon({ status }: { status: string }) {
  const s = status ?? '';
  const props = { size: 36, strokeWidth: 1.5 };
  if (s.includes('맑음') || s.includes('해')) return <Sun {...props} color="#f59e0b" />;
  if (s.includes('비')) return <CloudRain {...props} color="#60a5fa" />;
  if (s.includes('눈')) return <Snowflake {...props} color="#93c5fd" />;
  if (s.includes('번개') || s.includes('뇌우')) return <CloudLightning {...props} color="#a78bfa" />;
  if (s.includes('구름')) return <CloudSun {...props} color="#94a3b8" />;
  if (s.includes('흐림')) return <Cloud {...props} color="#94a3b8" />;
  return <Cloud {...props} color="#94a3b8" />;
}

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
          <div className="banner-badge" style={{ borderColor: accent, color: accent }}>
            {banner.badge}
          </div>
          <h2 className="banner-title">{banner.title}</h2>
          <p className="banner-subtitle">
            {(banner.subtitle || '').split('\n').map((line: string, i: number) => (
              <span key={line + i.toString()}>{line}{i === 0 && <br />}</span>
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
        {banner.imageUrl && <div className="banner-overlay" />}
      </div>

      <button className="banner-arrow banner-arrow--left" onClick={prev} aria-label="이전">
        <ChevronLeft size={20} />
      </button>
      <button className="banner-arrow banner-arrow--right" onClick={next} aria-label="다음">
        <ChevronRight size={20} />
      </button>

      <div className="banner-dots">
        {banners.map((b: BannerResponse, i: number) => (
          <button
            key={`dot-${b.id}-${i}`}
            className={`banner-dot${i === current ? ' banner-dot--active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`슬라이드 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, userId } = useAuth();
  const [detailedUserInfo, setDetailedUserInfo] = useState<UserInfo | null>(null);

  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const handleSelectCity = useCallback((city: typeof CITIES[0]) => {
    setSelectedCity(city);
    setWeatherLoading(true);
    setWeather(null);
  }, []);

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn && userId) {
      userApi
        .getProfile(userId)
        .then((res: AxiosResponse) => setDetailedUserInfo(res.data?.data))
        .catch(() => {});
    }
  }, [isLoggedIn, userId]);

  useEffect(() => {
    weatherApi
      .getTodayWeather(selectedCity.nx, selectedCity.ny)
      .then((res: AxiosResponse) => setWeather(res.data?.data))
      .catch(() => {})
      .finally(() => setWeatherLoading(false));
  }, [selectedCity]);

  useEffect(() => {
    noticeApi
      .getNoticeList({ page: 0, size: 6 })
      .then((res: AxiosResponse) => {
        const data = res.data?.data;
        setNotices(Array.isArray(data) ? data : data?.content || []);
      })
      .catch(() => {})
      .finally(() => setNoticesLoading(false));
  }, []);

  useEffect(() => {
    productApi
      .getProducts({ page: 0, size: 3, sort: 'createdAt', direction: 'desc' })
      .then((res: AxiosResponse) => {
        const data = res.data?.data;
        const list = Array.isArray(data) ? data : data?.content || [];
        setFeaturedProducts(list);
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  const renderNotices = () => {
    if (noticesLoading) return <p className="home-loading">불러오는 중...</p>;
    if (notices.length === 0) return <p className="home-empty">공지사항이 없습니다</p>;
    return (
      <ul className="home-notice-list">
        {notices.map((notice: NoticeItem) => (
          <li key={notice.id} className="home-notice-item" onClick={() => navigate(`/notices/${notice.id}`)}>
            <span className="home-notice-item__title">{notice.title}</span>
            <span className="home-notice-item__date">
              {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderFeaturedProducts = () => {
    if (productsLoading) return <p className="home-loading">불러오는 중...</p>;
    if (featuredProducts.length === 0) return <p className="home-empty">등록된 상품이 없습니다</p>;
    return (
      <div className="home-product-grid">
        {featuredProducts.map((product: ProductItem) => (
          <div
            key={product.id}
            className="home-product-card"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <div className="home-product-card__img">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} />
              ) : (
                <div className="home-product-card__img-placeholder">
                  <Shield size={36} color="#94a3b8" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="home-product-card__body">
              <p className="home-product-card__name">{product.name}</p>
              <p className="home-product-card__price">
                {product.price.toLocaleString('ko-KR')}원
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeather = () => {
    const weatherContent = weatherLoading ? (
      <p className="home-loading" style={{ padding: '12px 0' }}>불러오는 중...</p>
    ) : weather ? (
      <div className="home-weather-result">
        <div className="home-weather-main">
          <div className="home-weather-icon">
            <WeatherIcon status={weather.skyStatus ?? weather.description ?? ''} />
          </div>
          <div className="home-weather__temp">
            {weather.temperature ?? weather.temp ?? '--'}°
          </div>
        </div>
        <p className="home-weather__desc">
          {weather.skyStatus ?? weather.description ?? '정보 없음'}
        </p>
        <p className="home-weather__location">
          <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
          {selectedCity.label.replace('📍 ', '')}
        </p>
      </div>
    ) : (
      <div className="home-weather-result">
        <div className="home-weather-main">
          <div className="home-weather-icon">
            <Cloud size={36} color="#94a3b8" strokeWidth={1.5} />
          </div>
          <div className="home-weather__temp">--°</div>
        </div>
        <p className="home-weather__desc">날씨 정보 없음</p>
        <p className="home-weather__location">
          <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
          {selectedCity.label.replace('📍 ', '')}
        </p>
      </div>
    );

    return (
      <div className="home-weather-container">
        <KoreaWeatherMap
          cities={CITIES}
          selectedCityId={selectedCity.id}
          onSelectCity={handleSelectCity}
        />
        {weatherContent}
      </div>
    );
  };

  return (
    <div className="home-page">
      <Header />

      {/* Hero Banner */}
      <BannerCarousel />

      {/* Quick Actions */}
      <section className="home-quick-actions">
        <div className="home-inner">
          <div className="home-quick-grid">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.path}
                className="home-quick-btn"
                onClick={() => navigate(action.path)}
              >
                <action.Icon size={26} strokeWidth={1.5} className="home-quick-btn__icon" />
                <span className="home-quick-btn__label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content — 8+4 grid */}
      <div className="home-inner home-layout">

        {/* ── Left column (8) ── */}
        <div className="home-col-main">

          {/* 공지사항 */}
          <div className="home-card">
            <div className="home-card__header">
              <h3 className="home-card__title">공지사항</h3>
              <button className="home-card__more" onClick={() => navigate('/notices')}>더보기 ›</button>
            </div>
            <div className="home-card__body">
              {renderNotices()}
            </div>
          </div>

          {/* 추천 상품 */}
          <div className="home-card">
            <div className="home-card__header">
              <h3 className="home-card__title">추천 상품</h3>
              <button className="home-card__more" onClick={() => navigate('/products')}>전체보기 ›</button>
            </div>
            <div className="home-card__body">
              {renderFeaturedProducts()}
            </div>
          </div>

        </div>

        {/* ── Right column (4) ── */}
        <div className="home-col-side">

          {/* 오늘의 날씨 */}
          <div className="home-card">
            <div className="home-card__header">
              <h3 className="home-card__title">오늘의 날씨</h3>
            </div>
            <div className="home-card__body">
              {renderWeather()}
            </div>
          </div>

          {/* 내 정보 */}
          <div className="home-card">
            <div className="home-card__header">
              <h3 className="home-card__title">내 정보</h3>
            </div>
            <div className="home-card__body home-card__body--center">
              {isLoggedIn && detailedUserInfo ? (
                <>
                  <div className="home-userInfo">
                    <div className="home-userInfo__avatar">
                      {detailedUserInfo.username?.charAt(0) ?? 'U'}
                    </div>
                    <div>
                      <p className="home-userInfo__name">{detailedUserInfo.username}</p>
                      <p className="home-userInfo__email">{detailedUserInfo.email}</p>
                    </div>
                  </div>
                  <button className="home-btn home-btn--dark" onClick={() => navigate('/mypage')}>
                    마이페이지 바로가기
                  </button>
                </>
              ) : (
                <>
                  <div className="home-userInfo__avatar home-userInfo__avatar--guest">
                    <User size={24} color="#888" strokeWidth={1.5} />
                  </div>
                  <p className="home-guest-msg">로그인 후 이용하세요</p>
                  <button className="home-btn home-btn--dark" onClick={() => navigate('/login')}>
                    로그인
                  </button>
                </>
              )}
            </div>
          </div>

          {/* AI 상담 */}
          <div className="home-card home-card--accent">
            <div className="home-card__body home-card__body--center">
              <div className="home-ai-icon">
                <Bot size={40} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
              </div>
              <p className="home-ai-title">AI 병역 상담</p>
              <p className="home-ai-desc">궁금한 사항을 24시간 AI에게 물어보세요</p>
              <button className="home-btn home-btn--primary" onClick={() => navigate('/chat')}>
                상담 시작하기
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="home-mobile-nav">
        <button className="home-mobile-nav__item" onClick={() => navigate('/')}>
          <HomeIcon size={22} strokeWidth={1.5} />
          <span>홈</span>
        </button>
        <button className="home-mobile-nav__item" onClick={() => navigate('/products')}>
          <ShoppingBag size={22} strokeWidth={1.5} />
          <span>상품</span>
        </button>
        <button className="home-mobile-nav__item" onClick={() => navigate('/enlistment')}>
          <ClipboardList size={22} strokeWidth={1.5} />
          <span>입영</span>
        </button>
        <button className="home-mobile-nav__item" onClick={() => navigate('/cart')}>
          <ShoppingCart size={22} strokeWidth={1.5} />
          <span>장바구니</span>
        </button>
        <button className="home-mobile-nav__item" onClick={() => navigate('/mypage')}>
          <User size={22} strokeWidth={1.5} />
          <span>MY</span>
        </button>
      </nav>
    </div>
  );
}
