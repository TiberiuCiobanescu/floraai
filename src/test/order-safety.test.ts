import { describe, expect, it } from "vitest";
import { assertOrderEditable, changeProductName } from "@/features/florist/order-safety";
import { deadlineDateKey, modificationDeadline } from "@/features/florist/data";
import { initialOrders, initialLimits } from "./florist-fixtures";

describe("Live order safety", () => {
  it.each(["executata", "livrata", "anulata", "Executată", "Livrată", "Anulată"])("does not allow writes to settled status %s", (status) => {
    expect(() => assertOrderEditable(status)).toThrow();
  });
  it.each(["draft", "asteapta_client", "confirmata", "in_lucru"])("allows editing open status %s", (status) => {
    expect(() => assertOrderEditable(status)).not.toThrow();
  });
  it("updates the recipe from the selected database product, preserving entered text", () => {
    expect(changeProductName({ name: "Old", quantity: 2, composition: "bujor:9" }, "  BUCHET ROSU  ", [{ id: "P01", nume: "Buchet roșu", compozitie: "trandafir rosu:15" }])).toEqual({ name: "  BUCHET ROSU  ", quantity: 2, id: "P01", composition: "trandafir rosu:15" });
  });
  it("does not retain the old recipe for an unknown edited product", () => {
    expect(changeProductName({ name: "Old", quantity: 2, composition: "bujor:9" }, "Unknown", []).composition).toBe("");
  });
  it("does not serialize an invalid delivery deadline", () => {
    const order = initialOrders[0];
    if (!order) throw new Error("Missing test input");
    expect(deadlineDateKey(modificationDeadline({ ...order, date: "", time: "" }, initialLimits))).toBe("");
  });
  it("shows the Romanian date rather than the previous UTC date", () => {
    expect(deadlineDateKey(new Date("2026-11-14T22:30:00Z"))).toBe("2026-11-15");
  });
});