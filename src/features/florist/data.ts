import { textEquals } from "@/lib/normalize-text";

export type OrderStatus =
  "Draft" | "Așteaptă clientul" | "Confirmată" | "În lucru" | "Executată" | "Livrată";
export type OrderType = "Buchet în oraș" | "Nuntă";
export type Product = { id?: string; lineId?: number; name: string; quantity: number; composition?: string; extras?: string };
export type Order = {
  id: string;
  client: string;
  phone: string;
  type: OrderType;
  products: Product[];
  extras: string;
  date: string;
  time: string;
  address: string;
  recipient: string;
  note: string;
  status: OrderStatus;
  versions: string[];
  version?: number;
  question?: string;
  warning?: string;
  missingFields?: string[];
};
export type Message = {
  id: string;
  orderId: string;
  client: string;
  phone: string;
  time: string;
  received: string;
  text: string;
  channel: "WhatsApp" | "Telefon" | "Fizic";
  type: string;
  status: string;
  question?: string;
};
export const DEMO_NOW = new Date("2026-11-14T10:05:00+02:00");
// Phone matching ignores formatting only; never normalize or rewrite the saved input.
export function linkMessageToOrder(
  message: Omit<Message, "orderId">,
  orders: Order[],
): Message | undefined {
  const phone = message.phone.replace(/\D/g, "");
  if (!phone) return undefined;
  const order = orders.find((candidate) => candidate.phone.replace(/\D/g, "") === phone);
  return order ? { ...message, orderId: order.id } : undefined;
}
export function canMarkExecuted(status: OrderStatus) {
  return textEquals(status, "Confirmată") || textEquals(status, "În lucru");
}
export function modificationDeadline(order: Order, limits: Record<OrderType, number>) {
  return new Date(
    new Date(`${order.date}T${order.time.slice(0, 5)}:00+02:00`).getTime() - limits[order.type] * 3600000,
  );
}
export function isOverdue(message: Message) {
  return (
    textEquals(message.status, "Nou") &&
    DEMO_NOW.getTime() - new Date(/[Z]|[+-]\d{2}:\d{2}$/.test(message.received) ? message.received : `${message.received}+02:00`).getTime() > 2 * 3600000
  );
}
export function isLowStock(item: { quantity: number; threshold: number }) {
  return item.quantity <= item.threshold;
}
export function dateLabel(date: string) {
  if (!date || !Number.isFinite(new Date(`${date}T12:00:00`).getTime())) return "—";
  return new Date(`${date}T12:00:00`).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
  });
}
export function deadlineDateKey(deadline: Date) {
  if (!Number.isFinite(deadline.getTime())) return "";
  return deadline.toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
}
export function productSummary(order: Order) {
  return order.products.map((p) => `${p.quantity} ${p.name}`).join(", ");
}
