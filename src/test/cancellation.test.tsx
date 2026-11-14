import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CancellationDecision } from "@/features/florist/cancellation";
import { initialOrders } from "./florist-fixtures";

const resolveCancellation = vi.fn(async () => true);
vi.mock("@/features/florist/store", () => ({ useFlorist: () => ({ resolveCancellation }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const source = initialOrders[0];
if (!source) throw new Error("Missing fixture");
const order = { ...source, status: "Confirmată" as const, version: 4, warning: "Anulare primita dupa termen" };

it("accepts cancellation on the saved order and moves it to Anulată", async () => {
  const updated = vi.fn();
  render(<CancellationDecision order={order} onUpdated={updated} />);
  fireEvent.click(screen.getByRole("button", { name: "Acceptă anularea" }));
  await waitFor(() => expect(updated).toHaveBeenCalledWith({ ...order, status: "Anulată", warning: "", version: 5 }));
  expect(resolveCancellation).toHaveBeenCalledWith(order, true);
});
it("refuses cancellation without changing the saved order status", async () => {
  const updated = vi.fn();
  render(<CancellationDecision order={order} onUpdated={updated} />);
  fireEvent.click(screen.getByRole("button", { name: "Refuză" }));
  await waitFor(() => expect(updated).toHaveBeenCalledWith({ ...order, status: "Confirmată", warning: "", version: 5 }));
  expect(resolveCancellation).toHaveBeenCalledWith(order, false);
});
it("does not claim a cancellation succeeded when saving fails", async () => {
  resolveCancellation.mockResolvedValueOnce(false);
  const updated = vi.fn();
  render(<CancellationDecision order={order} onUpdated={updated} />);
  fireEvent.click(screen.getByRole("button", { name: "Acceptă anularea" }));
  await waitFor(() => expect(resolveCancellation).toHaveBeenCalled());
  expect(updated).not.toHaveBeenCalled();
});