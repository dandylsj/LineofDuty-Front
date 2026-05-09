import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clearPendingPayment } from "../store/pendingPayment";
import "../styles/payment.css";

export default function PaymentFail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const message = params.get("message");
  const code = params.get("code");
  const orderId = params.get("orderId");

  useEffect(() => {
    if (orderId) clearPendingPayment(orderId);
  }, [orderId]);

  return (
    <main className="payment-page">
      <section className="payment-card">
        <h2>결제에 실패했습니다</h2>
        <p>{message ?? ""}</p>
        {code ? <p style={{ opacity: 0.7 }}>({code})</p> : null}

        <div className="payment-actions">
          <button className="payment-btn" onClick={() => navigate("/products")}>
            다시 시도하기
          </button>
        </div>
      </section>
    </main>
  );
}
