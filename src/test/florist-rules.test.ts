import { describe, it, expect } from "vitest";
import {
  modificationDeadline,
  isLowStock,
  isOverdue,
  canMarkExecuted,
} from "@/features/florist/data";
import { initialOrders, initialMessages, initialLimits, initialStock } from "./florist-fixtures";
describe("Regulile florăriei", () => {
  it("buchetele pot fi modificate până la 3 ore înainte de livrare", () => {
    const order = initialOrders[0];
    if (!order) throw new Error("Missing bouquet fixture");
    expect(initialLimits["Buchet în oraș"]).toBe(3);
    expect(modificationDeadline(order, initialLimits).getTime()).toBe(
      new Date("2026-11-14T12:00:00+02:00").getTime(),
    );
  });
  it("nunțile pot fi modificate până la 72 de ore înainte de livrare", () => {
    const order = initialOrders[2];
    if (!order) throw new Error("Missing wedding fixture");
    expect(initialLimits.Nuntă).toBe(72);
    expect(modificationDeadline(order, initialLimits).getTime()).toBe(
      new Date("2026-11-18T10:00:00+02:00").getTime(),
    );
  });
  it("recalculează termenul din ora de început și setările actualizate", () => {
    const order = initialOrders[0];
    if (!order) throw new Error("Missing bouquet fixture");
    expect(modificationDeadline(order, { "Buchet în oraș": 7, Nuntă: 72 }).getTime()).toBe(
      new Date("2026-11-14T08:00:00+02:00").getTime(),
    );
    expect(
      modificationDeadline(
        { ...order, type: "Nuntă" },
        { "Buchet în oraș": 3, Nuntă: 48 },
      ).getTime(),
    ).toBe(new Date("2026-11-12T15:00:00+02:00").getTime());
  });
  it("folosește termenul de nuntă de 120 ore din setările conectate", () => {
    expect(modificationDeadline({ type: "Nuntă", date: "2026-11-21", time: "10:00-12:00" }, { "Buchet în oraș": 3, "Nuntă": 120 }).getTime()).toBe(new Date("2026-11-16T10:00:00+02:00").getTime());
  });
  it.each(["", "   "])("folosește ora 08:00 când intervalul lipsește (%s)", (time) => {
    const order = initialOrders[0];
    if (!order) throw new Error("Missing bouquet fixture");
    expect(modificationDeadline({ ...order, date: "2026-11-14", time }, initialLimits).getTime()).toBe(
      new Date("2026-11-14T05:00:00+02:00").getTime(),
    );
    expect(modificationDeadline({ ...order, type: "Nuntă", date: "2026-11-14", time }, initialLimits).getTime()).toBe(
      new Date("2026-11-11T08:00:00+02:00").getTime(),
    );
    expect(modificationDeadline({ ...order, date: "2026-11-14", time }, { ...initialLimits, "Buchet în oraș": 1 }).getTime()).toBe(
      new Date("2026-11-14T07:00:00+02:00").getTime(),
    );
  });
  it.each([
    ["Draft", false],
    ["Așteaptă clientul", false],
    ["De validat", false],
    ["Confirmată", true],
    ["Respinsă", false],
    ["Anulată", false],
    ["În lucru", true],
    ["Executată", false],
    ["Livrată", false],
  ] as const)("permite marcarea executată pentru %s: %s", (status, allowed) => {
    expect(canMarkExecuted(status)).toBe(allowed);
  });
  it("folosește pragul 50 pentru trandafir roșu și 20–25 pentru restul florilor", () => {
    expect(initialStock.find((item) => item.name === "Trandafir roșu")?.threshold).toBe(50);
    const others = initialStock.filter((item) => item.name !== "Trandafir roșu");
    expect(others).toHaveLength(2);
    for (const item of others) {
      expect(item.threshold).toBeGreaterThanOrEqual(20);
      expect(item.threshold).toBeLessThanOrEqual(25);
    }
  });
  it("stocul de 45 trandafiri este redus sub pragul de 50", () => {
    expect(isLowStock({ quantity: 45, threshold: 50 })).toBe(true);
    expect(isLowStock({ quantity: 50, threshold: 50 })).toBe(true);
  });
  it("doar mesajele noi mai vechi de 2 ore declanșează alerta", () => {
    expect(isOverdue({ ...initialMessages[0], received: "2026-11-14T07:00:00", status: "Nou" } as import("@/features/florist/data").Message)).toBe(true);
    const message = initialMessages[0];
    if (!message) throw new Error("Missing message fixture");
    expect(isOverdue({ ...message, received: "2026-11-14T10:00:00+02:00" })).toBe(false);
    expect(isOverdue({ ...message, status: "Confirmat" })).toBe(false);
  });
});
