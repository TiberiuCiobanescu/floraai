import { createContext, useContext, useState, type ReactNode } from "react";
import {
  initialOrders,
  initialMessages,
  initialStock,
  initialLimits,
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
  };
}
const FloristContext = createContext<ReturnType<typeof useFloristState> | null>(null);
export function FloristProvider({ children }: { children: ReactNode }) {
  const value = useFloristState();
  return <FloristContext.Provider value={value}>{children}</FloristContext.Provider>;
}
export function useFlorist() {
  const value = useContext(FloristContext);
  if (!value) throw new Error("FloristProvider missing");
  return value;
}
