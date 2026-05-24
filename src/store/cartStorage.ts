// ── 미완료 주문 PK 추적 (localStorage) ────────────────────────────────
// OrderCreate 마운트 시 생성된 DB 주문 PK를 기억해 두었다가
// 재결제 시 이전 주문을 삭제하거나 장바구니 비우기 시 DB도 함께 정리하는 데 사용
const PENDING_ORDER_KEY = "pentagon_pending_order_pk";

export function getPendingOrderPk(): number | null {
  const raw = localStorage.getItem(PENDING_ORDER_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setPendingOrderPk(orderPk: number): void {
  localStorage.setItem(PENDING_ORDER_KEY, String(orderPk));
}

export function clearPendingOrderPk(): void {
  localStorage.removeItem(PENDING_ORDER_KEY);
}
// ──────────────────────────────────────────────────────────────────────

export type CartItem = {
  productId: number;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  productImageUrl?: string;
  quantity: number;
};

const CART_KEY = "pentagon_cart_v1";

function safeParseJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function loadCart(): CartItem[] {
  const raw = safeParseJson(localStorage.getItem(CART_KEY));
  if (!Array.isArray(raw)) return [];

  return raw
    .map((it: any) => {
      const productId = typeof it?.productId === "number" ? it.productId : parseInt(String(it?.productId ?? ""), 10);
      const quantity = typeof it?.quantity === "number" ? it.quantity : parseInt(String(it?.quantity ?? ""), 10);
      if (!Number.isFinite(productId) || !Number.isFinite(quantity)) return null;

      return {
        productId,
        name: String(it?.name ?? ""),
        description: it?.description ? String(it.description) : undefined,
        price: Number(it?.price ?? 0),
        stock: typeof it?.stock === "number" ? it.stock : undefined,
        productImageUrl: it?.productImageUrl ? String(it.productImageUrl) : undefined,
        quantity: Math.max(1, quantity),
      } satisfies CartItem;
    })
    .filter(Boolean) as CartItem[];
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(
  product: Omit<CartItem, "quantity">,
  quantity: number
): CartItem[] {
  const items = loadCart();
  const nextQuantity = Math.max(1, quantity);

  const idx = items.findIndex((it) => it.productId === product.productId);
  if (idx >= 0) {
    const merged = {
      ...items[idx],
      ...product,
      quantity: items[idx].quantity + nextQuantity,
    };
    items[idx] = merged;
  } else {
    items.push({ ...product, quantity: nextQuantity });
  }

  saveCart(items);
  return items;
}

export function updateCartQuantity(productId: number, quantity: number): CartItem[] {
  const items = loadCart();
  const next = items
    .map((it) => (it.productId === productId ? { ...it, quantity: Math.max(1, quantity) } : it))
    .filter((it) => it.quantity > 0);
  saveCart(next);
  return next;
}

export function removeFromCart(productId: number): CartItem[] {
  const items = loadCart().filter((it) => it.productId !== productId);
  saveCart(items);
  return items;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
}
