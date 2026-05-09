import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";
import Header from "../components/Header";
import QuantitySelector from "../components/QuantitySelector";
import { addToCart } from "../store/cartStorage";
import "../styles/productDetail.css";

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    productApi.getProduct(Number(productId)).then(res => {
      setProduct(res.data.data);
    });
  }, [productId]);

  const handleBuy = () => {
    if (qty > product.stock) {
      alert("재고 수량이 충분하지 않습니다.");
      return;
    }

    navigate("/orders/new", {
      state: {
        product,
        quantity: qty,
      },
    });
  };

  const handleAddToCart = () => {
    if (qty > product.stock) {
      alert("재고 수량이 충분하지 않습니다.");
      return;
    }

    addToCart(
      {
        productId: product.productId,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        productImageUrl: product.productImageUrl,
      },
      qty
    );
    alert("장바구니에 담았습니다.");
  };

  if (!product) return null;

  return (
    <>
      <Header />
      <main className="product-detail">
        {product.productImageUrl && (
          <div className="product-image-wrap">
            <img src={product.productImageUrl} alt={product.name} loading="lazy" />
          </div>
        )}
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <p>가격: {product.price.toLocaleString()}원</p>

        <QuantitySelector value={qty} onChange={setQty} />

        <div className="product-actions">
          <button className="product-action secondary" onClick={handleAddToCart}>
            장바구니 담기
          </button>
          <button className="product-action primary" onClick={handleBuy}>
            구매하기
          </button>
        </div>
      </main>
    </>
  );
}
