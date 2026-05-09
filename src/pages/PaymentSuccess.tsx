import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import { paymentsApi } from "../api/paymentsApi";
import { clearPendingPayment, getPendingPayment } from "../store/pendingPayment";
import "../styles/payment.css";

function getErrorMessage(error: unknown) {
  const anyErr = error as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.response?.data?.code ||
    anyErr?.message ||
    "요청 처리 중 오류가 발생했습니다."
  );
}

function shouldTryDoneLookup(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("already") ||
    m.includes("processed") ||
    m.includes("이미") ||
    m.includes("중복")
  );
}

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const calledRef = useRef(false);

  useEffect(() => {
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");

    if (calledRef.current) return;
    calledRef.current = true;

    const amountNumber = amount ? Number(amount) : NaN;

    if (!paymentKey || !orderId || !amount || !Number.isFinite(amountNumber)) {
      alert("결제 정보가 올바르지 않습니다.");
      navigate("/");
      return;
    }

    const confirmPayment = async () => {
      try {
        const pending = getPendingPayment(orderId);
        const orderPk = pending?.orderPk ?? null;

        if (!orderPk) {
          alert("주문 정보를 찾지 못했습니다. 주문 페이지에서 다시 시도해주세요.");
          navigate("/orders");
          return;
        }

        // 1) createPayment: 결제 레코드 생성 + paymentKey 저장
        // 새로고침/중복진입 시 "이미 결제한 주문" 등으로 실패할 수 있어도 confirm을 시도
        let createError: unknown = null;
        try {
          await paymentsApi.createPayment({ orderId: orderPk, paymentKey });
        } catch (e) {
          createError = e;
        }

        // 2) confirmPayment: 토스 승인 + 재고 차감 + 주문 완료
        let res;
        try {
          res = await paymentsApi.confirmPayment({ paymentKey });
        } catch (e) {
          const confirmMsg = getErrorMessage(e);

          // 이미 처리된 결제/중복 승인 등으로 실패한 케이스에만 DONE 조회를 시도
          if (shouldTryDoneLookup(confirmMsg)) {
            try {
              const getRes = await paymentsApi.getPaymentByPaymentKey(paymentKey);
              const data = getRes.data?.data;
              const status = String((data as any)?.status ?? "").toUpperCase();
              if (status === "DONE") {
                clearPendingPayment(orderId);
                navigate("/orders/complete", { state: { payment: data } });
                return;
              }
            } catch {
              // ignore
            }
          }

          const createMsg = createError ? getErrorMessage(createError) : "";
          const message = createMsg && createMsg !== confirmMsg ? `${confirmMsg}\n(${createMsg})` : confirmMsg;
          alert(message);
          navigate("/products");
          return;
        }

        clearPendingPayment(orderId);
        navigate("/orders/complete", { state: { payment: res.data?.data } });
      } catch (error) {
        alert(getErrorMessage(error));
        navigate("/products");
      }
    };

    confirmPayment();
  }, [params, navigate]);

  return (
    <>
      <Header />
      <main className="payment-page">
        <section className="payment-card">
          <h2>결제 승인 처리 중입니다...</h2>
          <p>잠시만 기다려주세요.</p>
        </section>
      </main>
    </>
  );
}
