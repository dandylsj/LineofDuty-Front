const ORDER_HISTORY_KEY = "pentagon_order_history_v1";

function safeParseJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function loadOrderHistory(): number[] {
  const raw = safeParseJson(localStorage.getItem(ORDER_HISTORY_KEY));
  if (!Array.isArray(raw)) return [];

  const ids = raw
    .map((v: any) => (typeof v === "number" ? v : parseInt(String(v ?? ""), 10)))
    .filter((n: any): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);

  return Array.from(new Set(ids));
}

export function saveOrderHistory(ids: number[]) {
  const unique = Array.from(new Set(ids.filter((n) => Number.isFinite(n) && n > 0)));
  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(unique));
}

export function addOrderToHistory(orderId: number) {
  const ids = loadOrderHistory();
  if (!ids.includes(orderId)) {
    ids.unshift(orderId);
    saveOrderHistory(ids);
  }
  return ids;
}

export function clearOrderHistory() {
  localStorage.removeItem(ORDER_HISTORY_KEY);
}
