import "../styles/quantitySelector.css";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: Props) {
  const handleMinus = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handlePlus = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="qty-selector">
      <button
        className="qty-btn"
        onClick={handleMinus}
        disabled={value <= min}
      >
        −
      </button>

      <div className="qty-value">{value}</div>

      <button
        className="qty-btn"
        onClick={handlePlus}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
