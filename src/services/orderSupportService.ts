const SUPPORT_STORAGE_KEY = "terraform-flora.shop.order-support";
const SUPPORT_EVENT = "terraform-flora.order-support.updated";
export const ORDER_SUPPORT_OPEN_EVENT = "terraform-flora.order-support.open";

export type OrderSupportSender = "user" | "admin";

export interface OrderSupportMessage {
  id: string;
  orderId: string;
  orderCode: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  sender: OrderSupportSender;
  body: string;
  createdAt: string;
}

type CreateSupportMessageInput = Omit<OrderSupportMessage, "id" | "createdAt">;

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readMessages = (): OrderSupportMessage[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SUPPORT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OrderSupportMessage[]) : [];
  } catch {
    return [];
  }
};

const writeMessages = (messages: OrderSupportMessage[]) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event(SUPPORT_EVENT));
};

export const listOrderSupportMessages = () =>
  readMessages().sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));

export const listOrderSupportMessagesByOrder = (orderId: string) =>
  listOrderSupportMessages().filter((message) => message.orderId === orderId);

export const createOrderSupportMessage = (input: CreateSupportMessageInput) => {
  const message: OrderSupportMessage = {
    ...input,
    id: createId(),
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!message.body) return null;

  writeMessages([...readMessages(), message]);
  return message;
};

export const subscribeToOrderSupportMessages = (callback: (messages: OrderSupportMessage[]) => void) => {
  if (typeof window === "undefined") return () => {};

  const handleChange = () => callback(listOrderSupportMessages());
  window.addEventListener(SUPPORT_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  handleChange();

  return () => {
    window.removeEventListener(SUPPORT_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
};

export const openOrderSupportMessenger = (orderId?: string | null) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ORDER_SUPPORT_OPEN_EVENT, {
      detail: { orderId: orderId || null },
    })
  );
};
