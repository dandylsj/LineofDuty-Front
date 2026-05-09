import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { productApi } from "../api/productApi";
import "../styles/products.css";

type Product = {
  productId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  productImageUrl: string;
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productApi.getProducts();
        setProducts(res.data.data.content ?? res.data.data);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <Header />

      <main className="products-page">
        <h2 className="page-title">군장용품 구매</h2>
        <p className="page-desc">
          입영 전 필요한 물품을 미리 준비하세요.
        </p>

        {loading ? (
          <p>상품을 불러오는 중입니다...</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <div
                key={p.productId}
                className="product-card"
                onClick={() => navigate(`/products/${p.productId}`)}
              >
                <div className="thumb">
                  {p.productImageUrl && (
                    <img src={p.productImageUrl} alt={p.name} loading="lazy" />
                  )}
                </div>

                <h4 className="product-name">{p.name}</h4>
                <p className="product-desc">{p.description}</p>

                <div className="product-meta">
                  <span className="price">
                    {p.price.toLocaleString()}원
                  </span>
                  <span
                    className={
                      p.stock > 0 ? "stock" : "stock soldout"
                    }
                  >
                    {p.stock > 0 ? `재고 ${p.stock}` : "품절"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
