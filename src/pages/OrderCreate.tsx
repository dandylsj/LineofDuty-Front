import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { orderApi } from "../api/orderApi";
import type { OrderCreateData, OrderGetData } from "../api/orderApi";
import Header from "../components/Header";
import { setPendingPaymentV2 } from "../store/pendingPayment";
import "../styles/orderCreate.css";

/* =====================================================================
   타입 정의
===================================================================== */
type BulkItem = {
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

interface LocationState {
  isBulk?: boolean;
  items?: BulkItem[];
  product?: BulkItem["product"];
  quantity?: number;
}

/* =====================================================================
   헬퍼 함수 — 컴포넌트 외부에 선언 (any 없이 타입 안전하게)
===================================================================== */
const pickNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const extractOrderNumber = (data: OrderCreateData | OrderGetData | null | undefined): string | null => {
  if (!data) return null;
  const orderNumber = "orderNumber" in data ? data.orderNumber : undefined;
  if (typeof orderNumber === "string" && orderNumber.trim()) return orderNumber;
  return null;
};

/* =====================================================================
   컴포넌트
===================================================================== */
export default function OrderCreate() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const fromState = (state as LocationState) ?? {};
  const isBulk = fromState.isBulk === true && Array.isArray(fromState.items) && fromState.items.length > 0;
  const bulkItems: BulkItem[] = isBulk ? (fromState.items ?? []) : [];
  const singleProduct = fromState.product ?? null;
  const singleQuantity = fromState.quantity ?? null;

  // 화면 표시용 금액 (백엔드 응답 전 기준)
  const displayPrice = isBulk
    ? bulkItems.reduce((sum, it) => sum + it.product.price * it.quantity, 0)
    : (singleProduct?.price ?? 0) * (singleQuantity ?? 0);

  const orderName = (() => {
    if (!isBulk) return singleProduct?.name ?? "";
    if (bulkItems.length === 1) return bulkItems[0].product.name;
    return `${bulkItems[0].product.name} 외 ${bulkItems.length - 1}건`;
  })();

  // ── 주문 상태 (마운트 시 1번만 생성) ────────────────────────────
  const [isPaying,    setIsPaying]    = useState(false);
  const [orderPk,     setOrderPk]     = useState<number | null>(null);
  const [payAmount,   setPayAmount]   = useState<number | null>(null);
  const [tossOrderId, setTossOrderId] = useState<string | null>(null);
  const [orderReady,  setOrderReady]  = useState(false);

  // ── 마운트 시 주문 1번 생성 ──────────────────────────────────────
  useEffect(() => {
    if (!isBulk && (!singleProduct || !singleQuantity)) {
      setTimeout(() => navigate("/products"), 0);
      return;
    }

    const initOrder = async () => {
      try {
        const itemsToOrder: BulkItem[] = isBulk
          ? bulkItems
          : [{ product: singleProduct!, quantity: singleQuantity! }];

        let resolvedOrderPk: number | null = null;
        let resolvedAmount: number = displayPrice;
        let resolvedOrderId: string | null = null;

        for (const item of itemsToOrder) {
          const res = await orderApi.createOrder({
            productId: item.product.productId,
            quantity:  item.quantity,
          });

          const data: OrderCreateData | undefined = res.data?.data;
          if (!data) return;

          resolvedOrderPk = pickNumber(data.id);
          resolvedAmount  = pickNumber(data.totalPrice) ?? displayPrice;

          if (!resolvedOrderId) resolvedOrderId = extractOrderNumber(data);
        }

        if (!resolvedOrderPk) return;

        // orderNumber 없을 경우 getOrder로 보완
        if (!resolvedOrderId) {
          try {
            const detail = await orderApi.getOrder(resolvedOrderPk);
            resolvedOrderId = extractOrderNumber(detail.data?.data);
          } catch { /* ignore */ }
        }

        // ✅ addOrderToHistory는 여기서 호출하지 않음
        // → 결제 완료(PaymentSuccess) 시점에만 history에 추가
        setOrderPk(resolvedOrderPk);
        setPayAmount(resolvedAmount);
        setTossOrderId(resolvedOrderId);
        setOrderReady(true);
      } catch {
        alert("주문 초기화에 실패했습니다. 다시 시도해주세요.");
      }
    };

    void initOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열: 마운트 시 1번만 실행 — 재클릭 시 수량 누적 방지

  if (!isBulk && (!singleProduct || !singleQuantity)) return null;

  // ── 결제하기: Toss 결제창만 열기 (createOrder 재호출 없음) ────────
  const handlePayment = async () => {
    if (isPaying || !orderReady || !orderPk || !tossOrderId || payAmount === null) return;

    setIsPaying(true);
    setPendingPaymentV2(tossOrderId, { orderPk, amount: payAmount });

    // TossPayments SDK는 타입 선언이 없으므로 unknown → 명시적 캐스팅
    type TossPaymentsSDK = {
      TossPayments: (key: string) => {
        requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
      };
    };
    const tossPayments = (globalThis as unknown as TossPaymentsSDK)
      .TossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY as string);

    try {
      await tossPayments.requestPayment("카드", {
        amount:     payAmount,
        orderId:    tossOrderId,
        orderName,
        successUrl: `${globalThis.location.origin}/payments/success`,
        failUrl:    `${globalThis.location.origin}/payments/fail`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "결제창 호출 중 오류가 발생했습니다.";
      alert(msg);
      setIsPaying(false);
    }
  };

  /* ================================================================
     렌더링
  ================================================================ */
  return (
    <>
      <Header />
      <main className="order-create-page">
        <h2 className="order-create-title">주문 확인</h2>
        <p className="order-create-subtitle">결제 전 주문 정보를 확인해주세요.</p>

        <section className="order-create-card">
          {isBulk ? (
            <div className="order-create-bulk-list">
              {bulkItems.map((it) => (
                <div key={it.product.productId} className="order-create-item">
                  <div className="order-create-thumb">
                    {it.product.productImageUrl ? (
                      <img src={it.product.productImageUrl} alt={it.product.name} loading="lazy" />
                    ) : (
                      <div className="order-create-thumb-placeholder" />
                    )}
                  </div>
                  <div className="order-create-info">
                    <h3 className="order-create-name">{it.product.name}</h3>
                    {it.product.description && (
                      <p className="order-create-desc">{it.product.description}</p>
                    )}
                    <div className="order-create-row">
                      <span className="order-create-label">수량</span>
                      <span className="order-create-value">{it.quantity}</span>
                    </div>
                    <div className="order-create-row">
                      <span className="order-create-label">금액</span>
                      <span className="order-create-value">
                        {(it.product.price * it.quantity).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="order-create-item">
              <div className="order-create-thumb">
                {singleProduct?.productImageUrl ? (
                  <img src={singleProduct.productImageUrl} alt={singleProduct.name} loading="lazy" />
                ) : (
                  <div className="order-create-thumb-placeholder" />
                )}
              </div>
              <div className="order-create-info">
                <h3 className="order-create-name">{singleProduct?.name}</h3>
                {singleProduct?.description && (
                  <p className="order-create-desc">{singleProduct.description}</p>
                )}
                <div className="order-create-row">
                  <span className="order-create-label">수량</span>
                  <span className="order-create-value">{singleQuantity}</span>
                </div>
                <div className="order-create-row">
                  <span className="order-create-label">상품 금액</span>
                  <span className="order-create-value">
                    {(singleProduct?.price ?? 0).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="order-create-row total" style={{ padding: "16px 0 0", borderTop: "1px solid #e5e7ef" }}>
            <span className="order-create-label">총 결제금액</span>
            <span className="order-create-total">{displayPrice.toLocaleString()}원</span>
          </div>

          <div className="order-create-actions">
            <button className="order-create-btn ghost" onClick={() => navigate(-1)} disabled={isPaying}>
              돌아가기
            </button>
            <button
              className="order-create-btn"
              onClick={handlePayment}
              disabled={isPaying || !orderReady}
            >
              {(() => {
                if (!orderReady) return "주문 준비 중...";
                if (isPaying)    return "결제 요청 중...";
                return `${displayPrice.toLocaleString()}원 결제하기`;
              })()}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
