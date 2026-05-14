import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import { orderApi } from "../api/orderApi";
import { loadOrderHistory } from "../store/orderHistory";
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

// 상태를 한글로 변환하기 위한 맵
const STATUS_MAP: Record<string, string> = {
  'PENDING': '결제대기',
  'PAID': '결제완료',
  'SHIPPING': '배송중',
  'SHIPPED': '배송중',
  'DELIVERED': '배송완료',
  'CANCELLED': '주문취소',
};

export default function Orders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const ids = loadOrderHistory();
        if (ids.length === 0) {
          setOrders([]);
          return;
        }

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await orderApi.getOrder(id);
              const data = res.data?.data;
              
              // 주문 상품 목록 추출 (백엔드 응답 구조에 따라 달라질 수 있음)
              let items: OrderItem[] = [];
              if (data?.orderItems && Array.isArray(data.orderItems)) {
                items = data.orderItems;
              } else if (data?.items && Array.isArray(data.items)) {
                items = data.items;
              }

              return {
                id: data?.id ?? id,
                status: data?.status,
                totalPrice: data?.totalPrice ?? data?.total_price,
                createdAt: data?.createdAt ?? data?.created_at,
                items: items,
                raw: data,
              } as OrderSummary;
            } catch {
              return { id, raw: null } as OrderSummary;
            }
          })
        );

        // 최신순으로 정렬
        results.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setOrders(results);
      } catch (e: any) {
        setError(e?.response?.data?.message || "주문 내역을 불러오지 못했습니다.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusText = (status?: string) => {
    if (!status) return "결제완료";
    return STATUS_MAP[status.toUpperCase()] || status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="orders-layout">
      <Header />
      
      <main className="orders-container">
        <div className="orders-header">
          <h2 className="orders-page-title">주문목록/배송조회</h2>
        </div>

        {/* 필터 탭 (시각적 UI) */}
        <div className="orders-filter-tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''} 
            onClick={() => setActiveTab('all')}
          >
            최근 6개월
          </button>
          <button 
            className={activeTab === '2025' ? 'active' : ''} 
            onClick={() => setActiveTab('2025')}
          >
            2025년
          </button>
          <button 
            className={activeTab === '2024' ? 'active' : ''} 
            onClick={() => setActiveTab('2024')}
          >
            2024년
          </button>
        </div>

        {loading ? (
          <div className="orders-loading">
            <div className="spinner"></div>
            <p>주문 내역을 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="orders-error-box">
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty-box">
            <div className="empty-icon">📦</div>
            <p>최근 주문한 내역이 없습니다.</p>
            <button className="btn-go-shop" onClick={() => navigate('/products')}>
              상품 둘러보기
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const displayStatus = getStatusText(order.status);
              const hasItems = order.items && order.items.length > 0;
              
              return (
                <div key={order.id} className="order-item-card">
                  {/* 카드 헤더 (날짜 및 주문번호) */}
                  <div className="order-card-header">
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                    <div className="order-header-right">
                      <span className="order-id">주문번호 {order.id}</span>
                      <Link to="#" className="btn-order-detail">주문상세 ›</Link>
                    </div>
                  </div>

                  {/* 카드 바디 (상품 정보) */}
                  <div className="order-card-body">
                    <div className="order-status-title">
                      {displayStatus}
                    </div>

                    {!order.raw ? (
                      <div className="order-product-row error-row">
                        <p>상세 정보를 불러올 수 없습니다. (권한/만료/삭제)</p>
                      </div>
                    ) : hasItems ? (
                      // 상품이 있는 경우
                      order.items!.map((item, idx) => (
                        <div key={idx} className="order-product-row">
                          <div className="order-product-img" onClick={() => navigate(`/products/${item.productId}`)}>
                            {item.productImageUrl ? (
                              <img src={item.productImageUrl} alt={item.productName} />
                            ) : (
                              <div className="no-img">No Image</div>
                            )}
                          </div>
                          
                          <div className="order-product-info">
                            <h4 className="product-name" onClick={() => navigate(`/products/${item.productId}`)}>
                              {item.productName}
                            </h4>
                            <div className="product-meta">
                              <span className="price">{item.price.toLocaleString()}원</span>
                              <span className="qty">{item.quantity}개</span>
                            </div>
                          </div>
                          
                          <div className="order-product-actions">
                            <button className="btn-action primary">배송조회</button>
                            <button className="btn-action">교환/반품 신청</button>
                            <button className="btn-action">리뷰 작성</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      // 상품 상세가 없는(raw만 있는) 경우 Fallback UI
                      <div className="order-product-row fallback-row">
                        <div className="order-product-info">
                          <h4 className="product-name">
                            {order.raw?.orderName ?? '군장용품 외'}
                          </h4>
                          <div className="product-meta">
                            <span className="price-total">
                              총 결제금액: <strong>{order.totalPrice?.toLocaleString() ?? 0}원</strong>
                            </span>
                          </div>
                        </div>
                        <div className="order-product-actions">
                          <button className="btn-action primary">배송조회</button>
                          <button className="btn-action">영수증 캡증</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
