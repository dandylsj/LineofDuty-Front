import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";
import Header from "../components/Header";
import QuantitySelector from "../components/QuantitySelector";
import { addToCart } from "../store/cartStorage";
import "../styles/productDetail.css";

interface ProductImageItem {
  id: number;
  imageUrl: string;
  orderIndex: number;
}

interface ProductType {
  productId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  productImageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  shippingFee: number;
  freeShippingThreshold: number | null;
  deliveryType: 'STANDARD' | 'SAME_DAY' | 'DAWN';
  detailContent: string | null;
  images: ProductImageItem[];
  createdAt: string;
  modifiedAt: string;
}

const DELIVERY_LABELS = {
  STANDARD: '일반배송',
  SAME_DAY: '당일배송',
  DAWN: '새벽배송',
};

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detail' | 'delivery'>('detail');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    productApi.getProduct(Number(productId)).then(res => {
      const data: ProductType = res.data.data;
      setProduct(data);
      setSelectedImage(data.productImageUrl);
    });
  }, [productId]);

  if (!product) return null;

  const allImages: string[] = [
    ...(product.productImageUrl ? [product.productImageUrl] : []),
    ...(product.images ?? []).map(img => img.imageUrl),
  ];

  const totalPrice = product.price * qty;
  const isFreeShipping = product.shippingFee === 0 ||
    (product.freeShippingThreshold !== null && totalPrice >= product.freeShippingThreshold);

  const handleBuy = () => {
    if (qty > product.stock) { alert("재고 수량이 충분하지 않습니다."); return; }
    navigate("/orders/new", { state: { product, quantity: qty } });
  };

  const handleAddToCart = () => {
    if (qty > product.stock) { alert("재고 수량이 충분하지 않습니다."); return; }
    addToCart({ productId: product.productId, name: product.name, description: product.description, price: product.price, stock: product.stock, productImageUrl: product.productImageUrl ?? '' }, qty);
    alert("장바구니에 담았습니다.");
  };

  return (
    <>
      <Header />
      <div className="pd-wrap">

        {/* 브레드크럼 */}
        <div className="pd-breadcrumb">
          <Link to="/">홈</Link>
          <span> &gt; </span>
          <Link to="/products">군장용품</Link>
          {product.categoryName && <>
            <span> &gt; </span>
            <Link to={`/products?categoryId=${product.categoryId}`}>{product.categoryName}</Link>
          </>}
          <span> &gt; </span>
          <span>{product.name}</span>
        </div>

        {/* 상품 메인 영역 */}
        <div className="pd-main">

          {/* 좌: 이미지 */}
          <div className="pd-images">
            <div className="pd-main-image">
              {selectedImage
                ? <img src={selectedImage} alt={product.name} />
                : <div className="pd-no-image">이미지 없음</div>
              }
            </div>
            {allImages.length > 1 && (
              <div className="pd-thumbnails">
                {allImages.map((url, idx) => (
                  <button key={idx} className={`pd-thumb${selectedImage === url ? ' active' : ''}`}
                    onClick={() => setSelectedImage(url)}>
                    <img src={url} alt={`이미지 ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 우: 상품 정보 */}
          <div className="pd-info">
            {product.categoryName && (
              <div className="pd-category-tag">{product.categoryName}</div>
            )}
            <h1 className="pd-name">{product.name}</h1>
            <p className="pd-description">{product.description}</p>

            <div className="pd-divider" />

            {/* 가격 */}
            <div className="pd-price-row">
              <span className="pd-price-label">판매가</span>
              <span className="pd-price-value">{product.price.toLocaleString()}<em>원</em></span>
            </div>

            {/* 배송 정보 */}
            <div className="pd-info-row">
              <span className="pd-info-label">배송방법</span>
              <span className="pd-info-value">{DELIVERY_LABELS[product.deliveryType] ?? '일반배송'}</span>
            </div>
            <div className="pd-info-row">
              <span className="pd-info-label">배송비</span>
              <span className="pd-info-value">
                {product.shippingFee === 0
                  ? <span className="pd-free-ship">무료배송</span>
                  : <>
                    {product.shippingFee.toLocaleString()}원
                    {product.freeShippingThreshold !== null && (
                      <span className="pd-free-threshold">
                        &nbsp;({product.freeShippingThreshold.toLocaleString()}원 이상 무료)
                      </span>
                    )}
                  </>
                }
              </span>
            </div>
            <div className="pd-info-row">
              <span className="pd-info-label">재고</span>
              <span className={`pd-info-value ${product.stock > 0 ? 'pd-stock-ok' : 'pd-stock-out'}`}>
                {product.stock > 0 ? `${product.stock}개 남음` : '품절'}
              </span>
            </div>

            <div className="pd-divider" />

            {/* 수량 */}
            <div className="pd-info-row" style={{ alignItems: 'center' }}>
              <span className="pd-info-label">수량</span>
              <QuantitySelector value={qty} onChange={setQty} />
            </div>

            {/* 합계 */}
            <div className="pd-total-row">
              <span className="pd-total-label">합계</span>
              <span className="pd-total-value">{totalPrice.toLocaleString()}<em>원</em></span>
              {!isFreeShipping && product.shippingFee > 0 && (
                <span className="pd-total-ship">+ 배송비 {product.shippingFee.toLocaleString()}원</span>
              )}
              {isFreeShipping && product.shippingFee > 0 && (
                <span className="pd-free-ship" style={{ marginLeft: 8, fontSize: 13 }}>무료배송 적용</span>
              )}
            </div>

            {/* 버튼 */}
            {product.stock > 0 ? (
              <div className="pd-actions">
                <button className="pd-btn-cart" onClick={handleAddToCart}>장바구니 담기</button>
                <button className="pd-btn-buy" onClick={handleBuy}>바로 구매</button>
              </div>
            ) : (
              <div className="pd-actions">
                <button className="pd-btn-soldout" disabled>품절된 상품입니다</button>
              </div>
            )}
          </div>
        </div>

        {/* 상세 탭 영역 */}
        <div className="pd-detail-section">
          <div className="pd-tabs">
            <button className={`pd-tab${activeTab === 'detail' ? ' active' : ''}`}
              onClick={() => setActiveTab('detail')}>상품상세</button>
            <button className={`pd-tab${activeTab === 'delivery' ? ' active' : ''}`}
              onClick={() => setActiveTab('delivery')}>배송/반품</button>
          </div>

          {activeTab === 'detail' && (
            <div className="pd-tab-content">
              {/* 상세 텍스트/HTML */}
              {product.detailContent ? (
                <div className="pd-detail-content"
                  dangerouslySetInnerHTML={{ __html: product.detailContent }} />
              ) : (
                <p className="pd-no-detail">상세 내용이 없습니다.</p>
              )}

              {/* 상세 이미지들 */}
              {product.images && product.images.length > 0 && (
                <div className="pd-detail-images">
                  {product.images.map(img => (
                    <img key={img.id} src={img.imageUrl} alt={`상세 이미지 ${img.orderIndex + 1}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="pd-tab-content">
              <div className="pd-delivery-info">
                <h4>배송 안내</h4>
                <table className="pd-delivery-table">
                  <tbody>
                    <tr><th>배송방법</th><td>{DELIVERY_LABELS[product.deliveryType]}</td></tr>
                    <tr>
                      <th>배송비</th>
                      <td>
                        {product.shippingFee === 0 ? '무료' : `${product.shippingFee.toLocaleString()}원`}
                        {product.freeShippingThreshold !== null && product.shippingFee > 0 &&
                          ` (${product.freeShippingThreshold.toLocaleString()}원 이상 구매 시 무료)`}
                      </td>
                    </tr>
                    <tr><th>배송기간</th><td>{product.deliveryType === 'SAME_DAY' ? '당일 도착' : product.deliveryType === 'DAWN' ? '다음날 새벽 도착' : '2~5일 이내'}</td></tr>
                  </tbody>
                </table>
                <h4 style={{ marginTop: 24 }}>반품/교환 안내</h4>
                <p>상품 수령 후 7일 이내에 반품/교환이 가능합니다.<br />
                  단, 상품 훼손 또는 사용 후에는 반품/교환이 불가합니다.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
