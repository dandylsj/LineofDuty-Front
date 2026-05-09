import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "../styles/orderComplete.css";

type BulkCheckoutItem = {
  product: {
    productId: number;
    name: string;
    description?: string;
    price: number;
    stock?: number;
    productImageUrl?: string;
  };
  quantity: number;
};

type BulkCheckoutPayload = {
  index: number;
  items: BulkCheckoutItem[];
};

export default function OrderComplete() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const orderId = state?.order?.id ?? state?.payment?.orderId ?? state?.payment?.order_id;

  const BULK_CHECKOUT_KEY = "pentagon_bulk_checkout_v1";
  const bulk: BulkCheckoutPayload | null = (() => {
    const raw = sessionStorage.getItem(BULK_CHECKOUT_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<BulkCheckoutPayload>;
      if (!parsed || !Array.isArray(parsed.items)) return null;
      const idx = typeof parsed.index === "number" && Number.isFinite(parsed.index) ? parsed.index : 0;
      return { index: idx, items: parsed.items as BulkCheckoutItem[] };
    } catch {
      return null;
    }
  })();

  const nextItem = bulk?.items?.[Number(bulk.index) + 1] ?? null;

  const goNext = () => {
    if (!bulk) return;
    const nextIndex = Number(bulk.index) + 1;
    const item = bulk.items?.[nextIndex];
    if (!item) {
      sessionStorage.removeItem(BULK_CHECKOUT_KEY);
      return;
    }

    sessionStorage.setItem(
      BULK_CHECKOUT_KEY,
      JSON.stringify({ ...bulk, index: nextIndex })
    );
    navigate("/orders/new", { state: { product: item.product, quantity: item.quantity } });
  };

  const goOrders = () => navigate("/orders");
  const goHome = () => navigate("/");

  return (
    <>
      <Header />
      <main className="order-complete-page">
        <section className="complete-card">
          <h2>구매가 완료되었습니다</h2>
          <p className="desc">주문번호: {orderId ?? "-"}</p>

          <div className="actions">
            {nextItem && (
              <button className="primary" onClick={goNext}>
                다음 상품 결제
              </button>
            )}
            <button className={nextItem ? "secondary" : "primary"} onClick={goOrders}>
              주문 목록
            </button>
            <button className="secondary" onClick={goHome}>
              메인페이지
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
