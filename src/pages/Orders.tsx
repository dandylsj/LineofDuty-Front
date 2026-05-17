import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { orderApi } from "../api/orderApi";
import { loadOrderHistory } from "../store/orderHistory";
import { Package, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import "../styles/orders.css";

type OrderItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  productImageUrl?: string;
};

type OrderSummary = {
  id: number;
  status?: string;
  totalPrice?: number;
  createdAt?: string;
  items?: OrderItem[];
  raw?: any;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: '결제대기',  color: '#b45309', bg: '#fef3c7' },
  PAID:      { label: '결제완료',  color: '#1d4ed8', bg: '#dbeafe' },
  SHIPPING:  { label: '배송중',    color: '#0369a1', bg: '#e0f2fe' },
  SHIPPED:   { label: '배송중',    color: '#0369a1', bg: '#e0f2fe' },
  DELIVERED: { label: '배송완료',  color: '#15803d', bg: '#dcfce7' },
  CANCELLED: { label: '주문취소',  color: '#b91c1c', bg: '#fee2e2' },
};

const TABS = [
  { id: 'all',  label: '최근 6개월' },
  { id: '2026', label: '2026년' },
  { id: '2025', label: '2025년' },
  { id: '2024', label: '2024년' },
];

function getStatus(status?: string) {
  if (!status) return STATUS_MAP.PAID;
  return STATUS_MAP[status.toUpperCase()] ?? { label: status, color: '#555', bg: '#f3f4f6' };
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function OrderCard({ order, onNavigate }: { order: OrderSummary; onNavigate: (path: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const st = getStatus(order.status);
  const hasItems = (order.items?.length ?? 0) > 0;
  const firstItem = order.items?.[0];
  const extraCount = (order.items?.length ?? 0) - 1;

  return (
    <div className="oc-card">
      {/* ── 카드 헤더 ── */}
      <div className="oc-header">
        <div className="oc-header-left">
          <span className="oc-date">{formatDate(order.createdAt)}</span>
          <span className="oc-num">주문번호 {order.id}</span>
        </div>
        <div className="oc-header-right">
          <span className="oc-badge" style={{ color: st.color, background: st.bg }}>
            {st.label}
          </span>
          <button className="oc-toggle" onClick={() => setExpanded((v) => !v)} aria-label="펼치기/접기">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ── 상품 미리보기 (접혔을 때) ── */}
      {!expanded && firstItem && (
        <div className="oc-preview" onClick={() => setExpanded(true)}>
          <div className="oc-preview-img">
            {firstItem.productImageUrl ? (
              <img src={firstItem.productImageUrl} alt={firstItem.productName} />
            ) : (
              <div className="oc-no-img"><Package size={20} color="#aaa" /></div>
            )}
          </div>
          <span className="oc-preview-name">
            {firstItem.productName}{extraCount > 0 ? ` 외 ${extraCount}건` : ''}
          </span>
          <ChevronDown size={14} color="#aaa" />
        </div>
      )}

      {/* ── 카드 바디 (펼쳤을 때) ── */}
      {expanded && (
        <div className="oc-body">
          {!order.raw ? (
            <div className="oc-fetch-error">
              상세 정보를 불러올 수 없습니다.
            </div>
          ) : hasItems ? (
            <>
              {order.items!.map((item, idx) => (
                <div key={idx} className="oc-item-row">
                  {/* 상품 이미지 */}
                  <div
                    className="oc-item-img"
                    onClick={() => onNavigate(`/products/${item.productId}`)}
                  >
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          const ph = e.currentTarget.nextElementSibling as HTMLElement;
                          if (ph) ph.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="oc-no-img"
                      style={{ display: item.productImageUrl ? 'none' : 'flex' }}
                    >
                      <Package size={24} color="#aaa" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* 상품 정보 */}
                  <div className="oc-item-info">
                    <p
                      className="oc-item-name"
                      onClick={() => onNavigate(`/products/${item.productId}`)}
                    >
                      {item.productName}
                    </p>
                    <div className="oc-item-meta">
                      <span className="oc-item-price">{item.price.toLocaleString()}원</span>
                      <span className="oc-item-qty">수량 {item.quantity}개</span>
                    </div>
                    <div className="oc-item-subtotal">
                      소계&nbsp;
                      <strong>{(item.price * item.quantity).toLocaleString()}원</strong>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="oc-item-actions">
                    <button className="oc-btn oc-btn--primary">배송조회</button>
                    <button className="oc-btn">교환/반품</button>
                    <button className="oc-btn">리뷰 작성</button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* 상품 목록이 없는 경우 fallback */
            <div className="oc-item-row oc-item-row--fallback">
              <div className="oc-no-img" style={{ display: 'flex', width: 90, height: 90, flexShrink: 0 }}>
                <ShoppingBag size={28} color="#aaa" strokeWidth={1.5} />
              </div>
              <div className="oc-item-info">
                <p className="oc-item-name">{order.raw?.orderName ?? '군장용품 외'}</p>
                <div className="oc-item-meta">
                  <span className="oc-item-price">{order.totalPrice?.toLocaleString() ?? 0}원</span>
                </div>
              </div>
              <div className="oc-item-actions">
                <button className="oc-btn oc-btn--primary">배송조회</button>
              </div>
            </div>
          )}

          {/* ── 카드 푸터: 합계 ── */}
          <div className="oc-footer">
            <div className="oc-footer-info">
              <span className="oc-footer-label">총 결제금액</span>
              <span className="oc-footer-price">
                {(order.totalPrice ?? order.items?.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0).toLocaleString()}원
              </span>
            </div>
            <div className="oc-footer-actions">
              <button className="oc-btn oc-btn--outline" onClick={() => onNavigate(`/orders/${order.id}`)}>
                주문 상세보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const ids = loadOrderHistory();
        if (ids.length === 0) { setOrders([]); return; }

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await orderApi.getOrder(id);
              const data = res.data?.data;
              const items: OrderItem[] =
                data?.orderItems ?? data?.items ?? [];
              return {
                id: data?.id ?? id,
                status: data?.status,
                totalPrice: data?.totalPrice ?? data?.total_price,
                createdAt: data?.createdAt ?? data?.created_at,
                items,
                raw: data,
              } as OrderSummary;
            } catch {
              return { id, raw: null } as OrderSummary;
            }
          })
        );

        results.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setOrders(results);
      } catch (e: any) {
        setError(e?.response?.data?.message || '주문 내역을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return !o.createdAt || new Date(o.createdAt) >= sixMonthsAgo;
    }
    return o.createdAt?.startsWith(activeTab);
  });

  return (
    <div className="orders-layout">
      <Header />

      <main className="orders-container">
        {/* ── 페이지 헤더 ── */}
        <div className="orders-page-header">
          <h2 className="orders-page-title">주문목록 / 배송조회</h2>
          <p className="orders-page-sub">주문하신 상품의 배송 현황을 확인하세요</p>
        </div>

        {/* ── 기간 필터 탭 ── */}
        <div className="orders-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`orders-tab${activeTab === tab.id ? ' orders-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 주문 건수 요약 ── */}
        {!loading && !error && (
          <p className="orders-count">
            총 <strong>{filteredOrders.length}건</strong>의 주문
          </p>
        )}

        {/* ── 콘텐츠 ── */}
        {loading ? (
          <div className="orders-loading">
            <div className="orders-spinner" />
            <p>주문 내역을 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="orders-error">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <Package size={52} color="#ccc" strokeWidth={1.2} />
            <p>해당 기간에 주문한 내역이 없습니다.</p>
            <button className="oc-btn oc-btn--dark" onClick={() => navigate('/products')}>
              상품 둘러보기
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onNavigate={navigate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
