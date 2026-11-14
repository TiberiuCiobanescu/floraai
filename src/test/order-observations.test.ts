import { describe, expect, it } from "vitest";
import { orderObservations } from "@/features/florist/order-observations";
import { initialOrders, initialStock, initialLimits } from "@/features/florist/data";
import { recommendedClientQuestions } from "@/features/florist/client-questions";

const order = initialOrders[1];
if (!order) throw new Error("Missing order fixture");
describe("Observații pentru termen și stoc", () => {
  it("recalculează observația termenului din setările 3/1 ore", () => {
    expect(orderObservations(order, initialStock, initialLimits)[0]?.title).toBe("Termenul de modificare a trecut");
    expect(orderObservations(order, initialStock, { ...initialLimits, "Buchet în oraș": 1 })[0]?.title).toBe("Termenul de modificare este deschis");
  });
  it("însumează firele aceluiași produs fără diacritice și raportează lipsa exactă", () => {
    const observations = orderObservations({ ...order, products: [{ name: " TRandafiri ROSII ", quantity: 30 }, { name: "Trandafir roșu", quantity: 20 }] }, initialStock, initialLimits);
    expect(observations.find((entry) => entry.kind === "shortage")?.detail).toBe("Necesar: 50 fire · În stoc: 45 fire · Lipsesc: 5 fire.");
  });
  it("nu confundă pragul de alertă cu stocul insuficient", () => {
    expect(orderObservations({ ...order, products: [{ name: "Trandafiri roșii", quantity: 45 }] }, initialStock, initialLimits).some((entry) => entry.kind === "shortage")).toBe(false);
  });
  it("semnalează verificarea manuală fără a inventa rețeta unui buchet", () => {
    const observations = orderObservations({ ...order, products: [{ name: "Buchet mixt de toamnă", quantity: 1 }] }, initialStock, initialLimits);
    expect(observations.filter((entry) => entry.kind === "unknown")).toHaveLength(1);
    expect(observations.filter((entry) => entry.kind === "shortage")).toHaveLength(0);
  });
  it("include modelele observațiilor în recomandări fără să modifice comanda", () => {
    const before = JSON.stringify(order);
    const observations = orderObservations(order, initialStock, initialLimits);
    expect(recommendedClientQuestions(order, [], observations)[0]).toBe(observations[0]?.template);
    expect(JSON.stringify(order)).toBe(before);
  });
  it("nu avertizează privind producția unei comenzi deja livrate", () => {
    expect(orderObservations({ ...order, status: "Livrată" }, initialStock, initialLimits)).toEqual([]);
  });
});