import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { productApi } from "../api/productApi";
import { categoryApi } from "../api/categoryApi";
import type { CategoryResponse } from "../api/categoryApi";
import { getCategoryVisual } from "../utils/categoryVisual";
import { Truck, ShieldCheck, CreditCard, LayoutGrid } from "lucide-react";
import "../styles/products.css";

type Product = {
  productId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  productImageUrl: string | null;
  categoryId?: number;
  categoryName?: string;
  shippingFee?: number | null;
  freeShippingThreshold?: number | null;
};

type SortKey = "default" | "new" | "priceAsc" | "priceDesc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "추천순" },
  { key: "new", label: "최신순" },
  { key: "priceAsc", label: "낮은가격순" },
  { key: "priceDesc", label: "높은가격순" },
];

const PAGE_SIZE = 20;

function sortProducts(items: Product[], key: SortKey): Product[] {
  const sorted = [...items];
  if (key === "new") sorted.sort((a, b) => b.productId - a.productId);
  if (key === "priceAsc") sorted.sort((a, b) => a.price - b.price);
  if (key === "priceDesc") sorted.sort((a, b) => b.price - a.price);
  return sorted;
}

function shippingLabel(p: Product): { text: string; free: boolean } | null {
  if (p.freeShippingThreshold != null && p.price >= p.freeShippingThreshold) return { text: "무료배송", free: true };
  if (p.shippingFee === 0) return { text: "무료배송", free: true };
  if (p.shippingFee != null) return { text: `배송비 ${p.shippingFee.toLocaleString()}원`, free: false };
  return null;
}

export default function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("default");

  const searchParams = new URLSearchParams(location.search);
  const categoryIdParam = searchParams.get("categoryId");
  const selectedCategoryId = categoryIdParam ? Number(categoryIdParam) : null;

  useEffect(() => {
    categoryApi.getCategories()
      .then(res => setCategories(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCategoryId]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await productApi.getProducts({ page: currentPage, size: PAGE_SIZE });
        const data = res.data.data;
        // Spring Page 응답 구조 대응
        if (data?.content) {
          let items: Product[] = data.content;
          if (selectedCategoryId) {
            items = items.filter((p: Product) => p.categoryId === selectedCategoryId);
          }
          setProducts(items);
          setTotalPages(data.totalPages ?? 1);
          setTotalElements(data.totalElements ?? items.length);
        } else {
          // 배열로 내려오는 경우
          let items: Product[] = Array.isArray(data) ? data : [];
          if (selectedCategoryId) {
            items = items.filter((p: Product) => p.categoryId === selectedCategoryId);
          }
          setProducts(items);
          setTotalPages(1);
          setTotalElements(items.length);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, selectedCategoryId]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleCategoryClick = (id: number | null) => {
    if (id === null) {
      navigate('/products');
    } else {
      navigate(`/products?categoryId=${id}`);
    }
  };

  return (
    <div className="shop-layout">
      <Header />

      <section className="shop-hero">
        <div className="shop-hero__inner">
          <p className="shop-hero__eyebrow">LINE OF DUTY STORE</p>
          <h1 className="shop-hero__title">입영 준비, 여기서 한 번에</h1>
          <p className="shop-hero__desc">훈련소 생활에 꼭 필요한 군장용품을 모았습니다.</p>
          <ul className="shop-hero__benefits">
            <li><Truck size={16} /> 30,000원 이상 무료배송</li>
            <li><ShieldCheck size={16} /> 입영 필수품 엄선</li>
            <li><CreditCard size={16} /> 토스페이먼츠 안전결제</li>
          </ul>
        </div>
      </section>

      <main className="shop-container">
        {/* Category Navigation */}
        <nav className="shop-category-nav" aria-label="카테고리">
          <ul className="shop-category-list">
            <li>
              <button
                className={`shop-category-item${selectedCategoryId === null ? " active" : ""}`}
                onClick={() => handleCategoryClick(null)}
              >
                <span className="shop-category-icon" style={{ background: "#e6eef8", color: "#0050a0" }}>
                  <LayoutGrid size={22} strokeWidth={1.6} />
                </span>
                전체
              </button>
            </li>
            {categories.map(cat => {
              const { Icon, color, bg } = getCategoryVisual(cat.name);
              return (
                <li key={cat.id}>
                  <button
                    className={`shop-category-item${selectedCategoryId === cat.id ? " active" : ""}`}
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <span className="shop-category-icon" style={{ background: bg, color }}>
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    {cat.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Toolbar (Count & Sort) */}
        <div className="shop-toolbar">
          <div className="shop-total-count">
            {selectedCategory ? selectedCategory.name : "전체 상품"} <strong>{selectedCategoryId ? products.length : totalElements}</strong>개
            {totalPages > 1 && (
              <span className="shop-page-info">
                &nbsp;({currentPage + 1} / {totalPages} 페이지)
              </span>
            )}
          </div>
          <div className="shop-sort-options">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={sortKey === opt.key ? "active" : ""}
                onClick={() => setSortKey(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="shop-loading">
            <div className="spinner"></div>
            <p>상품을 불러오는 중입니다...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="shop-empty">
            <div className="empty-icon">🛍️</div>
            <p>등록된 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="shop-grid">
            {sortProducts(products, sortKey).map((p) => {
              const soldOut = p.stock <= 0;
              const lowStock = p.stock > 0 && p.stock < 10;
              const shipping = shippingLabel(p);
              const { Icon, color, bg } = getCategoryVisual(p.categoryName);

              return (
                <div
                  key={p.productId}
                  className={`shop-card${soldOut ? " shop-card--soldout" : ""}`}
                  onClick={() => navigate(`/products/${p.productId}`)}
                >
                  <div className="shop-card-image">
                    {p.productImageUrl ? (
                      <img src={p.productImageUrl} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="shop-no-image" style={{ background: bg, color }}>
                        <Icon size={44} strokeWidth={1.3} />
                        {p.categoryName && <span>{p.categoryName}</span>}
                      </div>
                    )}

                    <div className="shop-card-badges">
                      {lowStock && <span className="badge-low">품절임박</span>}
                    </div>
                    {soldOut && <div className="shop-card-soldout">SOLD OUT</div>}
                    {!soldOut && <div className="shop-card-hover">자세히 보기</div>}
                  </div>

                  <div className="shop-card-info">
                    {p.categoryName && (
                      <div className="shop-card-category">{p.categoryName}</div>
                    )}
                    <h3 className="shop-card-title">{p.name}</h3>
                    {p.description && <p className="shop-card-desc">{p.description}</p>}

                    <div className="shop-card-price-row">
                      <span className="shop-card-price">
                        {p.price.toLocaleString()}<em>원</em>
                      </span>
                    </div>

                    {shipping && (
                      <div className="shop-card-tags">
                        <span className={shipping.free ? "tag-free-ship" : "tag-ship"}>{shipping.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div className="shop-pagination">
            <button
              className="shop-page-btn"
              onClick={() => { setCurrentPage(0); window.scrollTo(0, 0); }}
              disabled={currentPage === 0}
            >
              «
            </button>
            <button
              className="shop-page-btn"
              onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0); }}
              disabled={currentPage === 0}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i)
              .filter(i => Math.abs(i - currentPage) <= 2)
              .map(i => (
                <button
                  key={i}
                  className={`shop-page-btn${i === currentPage ? ' shop-page-btn--active' : ''}`}
                  onClick={() => { setCurrentPage(i); window.scrollTo(0, 0); }}
                >
                  {i + 1}
                </button>
              ))}

            <button
              className="shop-page-btn"
              onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0); }}
              disabled={currentPage === totalPages - 1}
            >
              ›
            </button>
            <button
              className="shop-page-btn"
              onClick={() => { setCurrentPage(totalPages - 1); window.scrollTo(0, 0); }}
              disabled={currentPage === totalPages - 1}
            >
              »
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
