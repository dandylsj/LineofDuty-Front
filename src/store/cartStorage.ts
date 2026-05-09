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
