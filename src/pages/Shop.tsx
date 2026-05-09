import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";

export default function Shop() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await productApi.getProducts();
      setProducts(res.data?.data?.content ?? res.data?.data ?? []);
    };
    fetchProducts();
  }, []);

  return (
    <>
      <Header />
      <main className="shop-page">
        <h2>군용품 구매</h2>
        <div className="product-grid">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </main>
    </>
  );
}
