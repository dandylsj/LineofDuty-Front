type PendingPayment = {
  orderPk: number;
  amount: number;
  createdAt: number;
};

const KEY_PREFIX = "pendingPayment:";

export function setPendingPayment(tossOrderId: string, orderPk: number) {
  const payload: PendingPayment = { orderPk, amount: 0, createdAt: Date.now() };
  sessionStorage.setItem(KEY_PREFIX + tossOrderId, JSON.stringify(payload));
}

export function setPendingPaymentV2(tossOrderId: string, payload: { orderPk: number; amount: number }) {
  const toSave: PendingPayment = {
    orderPk: payload.orderPk,
    amount: typeof payload.amount === "number" && Number.isFinite(payload.amount) ? payload.amount : 0,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(KEY_PREFIX + tossOrderId, JSON.stringify(toSave));
}

export function getPendingPayment(tossOrderId: string): PendingPayment | null {
  const raw = sessionStorage.getItem(KEY_PREFIX + tossOrderId);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingPayment>;
    if (typeof parsed.orderPk !== "number") return null;
    return {
      orderPk: parsed.orderPk,
      amount: typeof parsed.amount === "number" ? parsed.amount : 0,
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : 0,
    };
  } catch {
    return null;
  }
}

export function clearPendingPayment(tossOrderId: string) {
  sessionStorage.removeItem(KEY_PREFIX + tossOrderId);
}
