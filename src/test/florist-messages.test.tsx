import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { initialMessages, initialOrders, linkMessageToOrder, type Message } from "@/features/florist/data";
import { FloristProvider, useFlorist } from "@/features/florist/store";

afterEach(cleanup);

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
};

function ReplyConsumer() {
  const { orders, messages, addMessage } = useFlorist();
  return <>
    <button onClick={() => addMessage(reply)}>Primește confirmare</button>
    <button onClick={() => addMessage({ ...reply, id: "completion", type: "Completare" })}>Primește completare</button>
    <output data-testid="orders">{JSON.stringify(orders)}</output>
    <output data-testid="messages">{JSON.stringify(messages)}</output>
  </>;
}

describe("Mesaje pentru comenzi existente", () => {
  it.each(["Completare", "Confirmare"])("leagă %s după telefon, nu după nume", (type) => {
    expect(linkMessageToOrder({ ...reply, client: "Alt nume", type }, initialOrders)?.orderId).toBe("1001");
    expect(linkMessageToOrder({ ...reply, phone: "0700000000", type }, initialOrders)).toBeUndefined();
    expect(linkMessageToOrder({ ...reply, phone: "", type }, initialOrders)).toBeUndefined();
  });

  it("datele mock conțin completarea adresei și confirmarea pentru aceeași comandă", () => {
    const completion = initialMessages.find((m) => m.type === "Completare");
    const confirmation = initialMessages.find((m) => m.type === "Confirmare");
    expect(completion?.orderId).toBe("1001");
    expect(completion?.text).toContain("Strada Florilor 24");
    expect(confirmation?.orderId).toBe("1001");
    expect(confirmation?.text).toBe("Da, e perfect, mulțumesc!");
    expect(completion?.phone).toBe(initialOrders[0]?.phone);
    expect(confirmation?.phone).toBe(initialOrders[0]?.phone);
  });

  it.each([
    ["Primește completare", "Completare"],
    ["Primește confirmare", "Confirmare"],
  ])("%s nu creează comenzi și nu schimbă statusul", (action, type) => {
    render(<FloristProvider><ReplyConsumer /></FloristProvider>);
    const before = screen.getByTestId("orders").textContent;
    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(screen.getByTestId("orders").textContent).toBe(before);
    const messages: Message[] = JSON.parse(screen.getByTestId("messages").textContent ?? "[]");
    expect(messages).toHaveLength(initialMessages.length + 1);
    expect(messages.at(-1)?.orderId).toBe("1001");
    expect(messages.at(-1)?.type).toBe(type);
  });
});