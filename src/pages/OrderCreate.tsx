import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { orderApi } from "../api/orderApi";
import Header from "../components/Header";
import { addOrderToHistory } from "../store/orderHistory";
import { setPendingPaymentV2 } from "../store/pendingPayment";
import "../styles/orderCreate.css";

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

export default function OrderCreate() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);

  const fromState = (state as any) || {};

  // 단건 주문 or 전체 주문 구분
  const isBulk = fromState.isBulk === true && Array.isArray(fromState.items) && fromState.items.length > 0;
  const bulkItems: BulkItem[] = isBulk ? fromState.items : [];

  // 단건일 때 상품 정보
  const singleProduct = fromState.product ?? null;
  const singleQuantity = fromState.quantity ?? null;

  // 총 금액
  const totalPrice = isBulk
    ? bulkItems.reduce((sum, it) => sum + it.product.price * it.quantity, 0)
    : (singleProduct?.price ?? 0) * (singleQuantity ?? 0);

  // 대표 상품명 (토스 결제창 표시용)
  const orderName = isBulk
    ? bulkItems.length === 1
      ? bulkItems[0].product.name
      : `${bulkItems[0].product.name} 외 ${bulkItems.length - 1}건`
    : singleProduct?.name ?? "";

  useEffect(() => {
    if (!isBulk && (!singleProduct || !singleQuantity)) {
      setTimeout(() => navigate("/products"), 0);
    }
  }, [isBulk, singleProduct, singleQuantity, navigate]);

  if (!isBulk && (!singleProduct || !singleQuantity)) return null;

  const pickNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const extractOrderNumber = (obj: any): string | null => {
    if (!obj) return null;
    const candidates = [
      obj.orderNumber, obj.order_number, obj.orderNo,
      obj.order_no, obj.orderNum, obj.order_num,
      obj?.order?.orderNumber, obj?.order?.order_number,
    ];
    for (const v of candidates) {
      if (typeof v === "string" && v.trim()) return v;
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
    }
    return null;
  };

  const handlePayment = async () => {
    if (isPaying) return;
    setIsPaying(true);

    try {
      let finalOrderPk: number | null = null;
      let finalAmount = totalPrice;
      let tossOrderId: string | null = null;

      // 전체 결제: 모든 상품을 순서대로 createOrder (백엔드가 같은 주문서에 자동으로 추가)
      // 단건 결제: 상품 하나만 createOrder
      const itemsToOrder: BulkItem[] = isBulk
        ? bulkItems
        : [{ product: singleProduct, quantity: singleQuantity }];

      for (const item of itemsToOrder) {
        const orderRes = await orderApi.createOrder({
          productId: item.product.productId,
          quantity: item.quantity,
        });

        const data = orderRes.data?.data;
        if (!data) {
          alert("주문 생성 응답이 올바르지 않습니다.");
          setIsPaying(false);
          return;
        }

        const orderPk =
          pickNumber((data as any).id) ??
          pickNumber((data as any).orderId) ??
          pickNumber((data as any).order_id);

        if (!orderPk) {
          alert("주문 정보를 확인할 수 없습니다.");
          setIsPaying(false);
          return;
        }

        // 마지막 응답의 totalPrice = 전체 합산 금액
        finalOrderPk = orderPk;
        finalAmount =
          pickNumber((data as any).totalPrice) ??
          pickNumber((data as any).total_price) ??
          pickNumber((data as any).totalAmount) ??
          pickNumber((data as any).total_amount) ??
          totalPrice;

        if (!tossOrderId) {
          tossOrderId = extractOrderNumber(data);
        }
      }

      if (!finalOrderPk) {
        alert("주문 정보를 확인할 수 없습니다.");
        setIsPaying(false);
        return;
      }

      addOrderToHistory(finalOrderPk);

      // orderNumber가 없으면 getOrder로 조회
      if (!tossOrderId) {
        try {
          const detailRes = await orderApi.getOrder(finalOrderPk);
          tossOrderId = extractOrderNumber(detailRes.data?.data);
        } catch {
          // ignore
        }
      }

      if (!tossOrderId) {
        alert(
          "주문번호(orderNumber)를 응답에서 찾지 못했습니다.\n" +
          "백엔드 /api/orders 응답 DTO에 orderNumber 필드가 필요합니다."
        );
        setIsPaying(false);
        return;
      }

      // 결제 성공 후 처리를 위해 저장
      setPendingPaymentV2(tossOrderId, { orderPk: finalOrderPk, amount: finalAmount });

      const tossPayments = (window as any).TossPayments(
        import.meta.env.VITE_TOSS_CLIENT_KEY
      );

      try {
        await tossPayments.requestPayment("카드", {
          amount: finalAmount,
          orderId: tossOrderId,
          orderName,
          successUrl: `${window.location.origin}/payments/success`,
          failUrl: `${window.location.origin}/payments/fail`,
        });
      } catch (e: any) {
        const msg = e?.message || e?.code || "결제창 호출 중 오류가 발생했습니다.";
        alert(String(msg));
        setIsPaying(false);
      }
    } catch {
      alert("결제 요청 실패");
      setIsPaying(false);
    }
  };

  return (
    <>
      <Header />
      <main className="order-create-page">
        <h2 className="order-create-title">주문 확인</h2>
        <p className="order-create-subtitle">결제 전 주문 정보를 확인해주세요.</p>

        <section className="order-create-card">
          {/* 전체 결제: 모든 상품 목록 표시 */}
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
            /* 단건 결제: 상품 하나 표시 */
            <div className="order-create-item">
              <div className="order-create-thumb">
                {singleProduct.productImageUrl ? (
                  <img src={singleProduct.productImageUrl} alt={singleProduct.name} loading="lazy" />
                ) : (
                  <div className="order-create-thumb-placeholder" />
                )}
              </div>
              <div className="order-create-info">
                <h3 className="order-create-name">{singleProduct.name}</h3>
                {singleProduct.description && (
                  <p className="order-create-desc">{singleProduct.description}</p>
                )}
                <div className="order-create-row">
                  <span className="order-create-label">수량</span>
                  <span className="order-create-value">{singleQuantity}</span>
                </div>
                <div className="order-create-row">
                  <span className="order-create-label">상품 금액</span>
                  <span className="order-create-value">
                    {(singleProduct.price ?? 0).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 총 결제금액 */}
          <div className="order-create-row total" style={{ padding: "16px 0 0", borderTop: "1px solid #e5e7ef" }}>
            <span className="order-create-label">총 결제금액</span>
            <span className="order-create-total">{totalPrice.toLocaleString()}원</span>
          </div>

          <div className="order-create-actions">
            <button
              className="order-create-btn ghost"
              onClick={() => navigate(-1)}
              disabled={isPaying}
            >
              돌아가기
            </button>
            <button
              className="order-create-btn"
              onClick={handlePayment}
              disabled={isPaying}
            >
              {isPaying
                ? isBulk
                  ? "주문 처리 중..."
                  : "결제 요청 중..."
                : `${totalPrice.toLocaleString()}원 결제하기`}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
