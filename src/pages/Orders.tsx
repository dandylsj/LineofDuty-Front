import { useEffect, useState } from "react";
import Header from "../components/Header";
import { orderApi } from "../api/orderApi";
import { loadOrderHistory } from "../store/orderHistory";
import "../styles/orders.css";

type OrderSummary = {
  id: number;
  status?: string;
  totalPrice?: number;
  createdAt?: string;
  raw?: any;
};

export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string>("");

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
              return {
                id: (data as any)?.id ?? id,
                status: (data as any)?.status,
                totalPrice: (data as any)?.totalPrice ?? (data as any)?.total_price,
                createdAt: (data as any)?.createdAt ?? (data as any)?.created_at,
                raw: data,
              } as OrderSummary;
            } catch {
              return { id, raw: null } as OrderSummary;
            }
          })
        );

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

  return (
    <>
      <Header />
      <main className="orders-page">
        <h2 className="orders-title">주문 내역</h2>

        {loading ? (
          <p className="orders-muted">불러오는 중...</p>
        ) : error ? (
          <p className="orders-error">{error}</p>
        ) : orders.length === 0 ? (
          <p className="orders-muted">주문 내역이 없습니다.</p>
        ) : (
          <div className="orders-list">
            {orders.map((o) => (
              <div key={o.id} className="orders-card">
                <div className="orders-row">
                  <strong>주문ID</strong>
                  <span>{o.id}</span>
                </div>
                <div className="orders-row">
                  <strong>상태</strong>
                  <span>{o.status ?? "-"}</span>
                </div>
                <div className="orders-row">
                  <strong>금액</strong>
                  <span>
                    {typeof o.totalPrice === "number"
                      ? `${o.totalPrice.toLocaleString()}원`
                      : "-"}
                  </span>
                </div>
                <div className="orders-row">
                  <strong>생성일</strong>
                  <span>
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleString("ko-KR")
                      : "-"}
                  </span>
                </div>

                {!o.raw && (
                  <p className="orders-muted">상세 조회 실패(권한/만료/삭제 가능)</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
