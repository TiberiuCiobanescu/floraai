import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderValidation } from "@/features/florist/order-validation";
import { initialOrders } from "./florist-fixtures";

const validateOrder = vi.fn(async () => true);
const rejectOrder = vi.fn(async () => true);
vi.mock("@/features/florist/store", () => ({ useFlorist: () => ({ validateOrder, rejectOrder }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Validarea florarului", () => {
  const source = initialOrders[0];
  if (!source) throw new Error("Missing order fixture");
  const order = { ...source, status: "De validat" as const, version: 4 };

  it("validează exact comanda și versiunea care așteaptă decizia", async () => {
    render(<OrderValidation order={order} onUpdated={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Validează" }));
    await waitFor(() => expect(validateOrder).toHaveBeenCalledWith(order));
  });

  it("trimite motivul scris de florar la respingere", async () => {
    render(<OrderValidation order={order} onUpdated={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Respinge" }));
    fireEvent.change(screen.getByLabelText("Motivul respingerii"), { target: { value: "Stoc indisponibil" } });
    fireEvent.click(screen.getByRole("button", { name: "Respinge și anunță clientul" }));
    await waitFor(() => expect(rejectOrder).toHaveBeenCalledWith(order, "Stoc indisponibil"));
  });
});
