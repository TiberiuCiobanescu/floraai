import { describe, expect, it } from "vitest";
import { linkMessageToOrder, type Message } from "@/features/florist/data";
import { initialOrders } from "./florist-fixtures";

const reply: Omit<Message, "orderId"> = {
  id: "test-reply",
  client: "Andreea Popescu",
  phone: "0722345678",
  time: "11:50",
  received: "2026-11-14T11:50:00",
  text: "Da, e perfect, mulțumesc!",
  channel: "WhatsApp",
  type: "Confirmare",
  status: "Nou",
  direction: "client",
};

describe("Mesaje pentru comenzi existente", () => {
  it.each(["Completare", "Confirmare"])("leagă %s după telefon fără confirmare automată", (type) => {
    const before = JSON.stringify(initialOrders);
    expect(linkMessageToOrder({ ...reply, client: "Alt nume", type }, initialOrders)?.orderId).toBe("test-1");
    expect(linkMessageToOrder({ ...reply, phone: "0700000000", type }, initialOrders)).toBeUndefined();
    expect(linkMessageToOrder({ ...reply, phone: "", type }, initialOrders)).toBeUndefined();
    expect(JSON.stringify(initialOrders)).toBe(before);
  });
});
