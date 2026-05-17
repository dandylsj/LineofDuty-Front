import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { productApi } from "../api/productApi";
import { categoryApi } from "../api/categoryApi";
import type { CategoryResponse } from "../api/categoryApi";
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
};

const PAGE_SIZE = 20;

export default function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

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

      <main className="shop-container">
        {/* Category Navigation */}
        <div className="shop-category-nav">
          <h2 className="shop-page-title">전체 상품</h2>
          <ul className="shop-category-list">
            <li 
              className={selectedCategoryId === null ? 'active' : ''}
              onClick={() => handleCategoryClick(null)}
            >
              전체보기
            </li>
            {categories.map(cat => (
              <li 
                key={cat.id} 
                className={selectedCategoryId === cat.id ? 'active' : ''}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Toolbar (Count & Sort) */}
        <div className="shop-toolbar">
          <div className="shop-total-count">
            전체 <strong>{totalElements}</strong>개
            {totalPages > 1 && (
              <span className="shop-page-info">
                &nbsp;({currentPage + 1} / {totalPages} 페이지)
              </span>
            )}
          </div>
          <div className="shop-sort-options">
            <button className="active">인기순</button>
            <button>최신순</button>
            <button>낮은가격순</button>
            <button>높은가격순</button>
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
            {products.map((p) => {
              const isFreeShipping = p.price >= 50000; // UI 용 가상 로직 (5만원 이상 무료배송)
              const isBest = p.stock < 100 && p.stock > 0; // UI 용 가상 로직
              
              return (
                <div
                  key={p.productId}
                  className="shop-card"
                  onClick={() => navigate(`/products/${p.productId}`)}
                >
                  <div className="shop-card-image">
                    {p.productImageUrl ? (
                      <img src={p.productImageUrl} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="shop-no-image">No Image</div>
                    )}
                    
                    {/* Tags */}
                    <div className="shop-card-badges">
                      {isBest && <span className="badge-best">BEST</span>}
                      {p.stock === 0 && <span className="badge-soldout">품절</span>}
                    </div>
                  </div>

                  <div className="shop-card-info">
                    {p.categoryName && (
                      <div className="shop-card-category">{p.categoryName}</div>
                    )}
                    <h3 className="shop-card-title">{p.name}</h3>
                    
                    <div className="shop-card-price-row">
                      <span className="shop-card-price">
                        {p.price.toLocaleString()}<em>원</em>
                      </span>
                    </div>

                    <div className="shop-card-tags">
                      {isFreeShipping && <span className="tag-free-ship">무료배송</span>}
                      {p.stock > 0 && p.stock < 10 && (
                        <span className="tag-low-stock">품절임박</span>
                      )}
                    </div>
                    
                    <div className="shop-card-review">
                      <span className="star">★</span> 4.8 <span>(120)</span>
                    </div>
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
