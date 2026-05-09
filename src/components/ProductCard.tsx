import { useNavigate } from "react-router-dom";

export default function ProductCard({ product }: any) {
  const navigate = useNavigate();

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/shop/${product.id}`)}
    >
      <div className="thumbnail" />
      <h4>{product.name}</h4>
      <p>{product.price.toLocaleString()}원</p>
    </div>
  );
}
