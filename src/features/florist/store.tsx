import { createContext, useContext, useState, type Context, type ReactNode } from "react";
import {
  initialOrders,
  initialMessages,
  initialStock,
  initialLimits,
  linkMessageToOrder,
  type Order,
  type Message,
} from "./data";
function useFloristState() {
  const [orders, setOrders] = useState(initialOrders);
  const [messages, setMessages] = useState(initialMessages);
  const [stock, setStock] = useState(initialStock);
  const [limits, setLimits] = useState(initialLimits);
  const updateOrder = (order: Order) =>
    setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
  const updateMessage = (orderId: string, status: string) =>
    setMessages((prev) => prev.map((m) => (m.orderId === orderId ? { ...m, status } : m)));
  const addOrder = (order: Order, message: Message) => {
    setOrders((prev) => [...prev, order]);
    setMessages((prev) => [message, ...prev]);
  };
  const addMessage = (message: Omit<Message, "orderId">) => {
    const linked = linkMessageToOrder(message, orders);
    if (!linked) return false;
    setMessages((prev) => [...prev, linked]);
    return true;
  };
  return {
    orders,
    messages,
    stock,
    limits,
    setStock,
    setLimits,
    updateOrder,
    updateMessage,
    addOrder,
    addMessage,
  };
}
type FloristValue = ReturnType<typeof useFloristState>;
// An open preview can retain the old provider while a route receives the refreshed hook.
// Preserve context identity across hot updates; never share request state globally in SSR.
const previousContext = import.meta.hot?.data?.["floristContext"] as
  | Context<FloristValue | null>
  | undefined;
const FloristContext = previousContext ?? createContext<FloristValue | null>(null);
if (import.meta.hot?.data) import.meta.hot.data["floristContext"] = FloristContext;
export function FloristProvider({ children }: { children: ReactNode }) {
  const value = useFloristState();
  return <FloristContext.Provider value={value}>{children}</FloristContext.Provider>;
}
export function useFlorist() {
  const value = useContext(FloristContext);
  if (!value) throw new Error("FloristProvider missing");
  return value;
}
