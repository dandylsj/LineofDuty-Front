import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import QuantitySelector from "../components/QuantitySelector";
import {
  clearCart,
  getCartTotal,
  loadCart,
  removeFromCart,
  type CartItem,
  updateCartQuantity,
} from "../store/cartStorage";
import "../styles/cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const total = getCartTotal(items);

  // 전체 상품을 state로 넘겨서 OrderCreate에서 한 번에 결제
  const startBulkCheckout = () => {
    if (items.length === 0) return;
    navigate("/orders/new", {
      state: {
        isBulk: true,
        items: items.map((it) => ({
          product: {
            productId: it.productId,
            name: it.name,
            description: it.description,
            price: it.price,
            stock: it.stock,
            productImageUrl: it.productImageUrl,
          },
          quantity: it.quantity,
        })),
      },
    });
  };

  return (
    <>
      <Header />
      <main className="cart-page">
        <h2 className="cart-title">장바구니</h2>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>장바구니가 비어있습니다.</p>
            <button className="cart-btn" onClick={() => navigate("/products")}>상품 보러가기</button>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {items.map((it) => (
                <div key={it.productId} className="cart-item">
                  <div className="cart-thumb">
                    {it.productImageUrl ? (
                      <img src={it.productImageUrl} alt={it.name} loading="lazy" />
                    ) : (
                      <div className="cart-thumb-placeholder" />
                    )}
                  </div>

                  <div className="cart-info">
                    <h4 className="cart-name">{it.name}</h4>
                    {it.description && <p className="cart-desc">{it.description}</p>}

                    <div className="cart-row">
                      <span className="cart-price">{it.price.toLocaleString()}원</span>
                      <QuantitySelector
                        value={it.quantity}
                        onChange={(q) => setItems(updateCartQuantity(it.productId, q))}
                        min={1}
                        max={typeof it.stock === "number" && it.stock > 0 ? it.stock : 99}
                      />
                    </div>

                    <div className="cart-actions">
                      <button
                        className="cart-btn ghost"
                        onClick={() => setItems(removeFromCart(it.productId))}
                      >
                        삭제
                      </button>
                      <button
                        className="cart-btn"
                        onClick={() =>
                          navigate("/orders/new", {
                            state: {
                              product: {
                                productId: it.productId,
                                name: it.name,
                                description: it.description,
                                price: it.price,
                                stock: it.stock,
                                productImageUrl: it.productImageUrl,
                              },
                              quantity: it.quantity,
                            },
                          })
                        }
                      >
                        주문하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-total">
                <span>총 결제금액</span>
                <strong>{total.toLocaleString()}원</strong>
              </div>
              <div className="cart-summary-actions">
                <button className="cart-btn" onClick={startBulkCheckout}>
                  전체 결제하기
                </button>
                <button
                  className="cart-btn ghost"
                  onClick={() => {
                    clearCart();
                    setItems([]);
                  }}
                >
                  비우기
                </button>
                <button className="cart-btn" onClick={() => navigate("/products")}>
                  계속 쇼핑
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
