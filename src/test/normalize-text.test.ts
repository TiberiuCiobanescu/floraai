import { describe, expect, it } from "vitest";
import { normalizeText, textEquals, textIncludes } from "@/lib/normalize-text";
import { productSummary } from "@/features/florist/data";
import { initialStock, initialOrders } from "./florist-fixtures";

describe("Comparisons without Romanian diacritics", () => {
  it("normalizes lowercase, Romanian diacritics and surrounding spaces", () => {
    expect(normalizeText("  ĂÂÎȘŞȚŢ  ")).toBe("aaisstt");
    expect(normalizeText("  Trandafir roșu  ")).toBe("trandafir rosu");
    expect(normalizeText("s\u0326t\u0326a\u0306")).toBe("sta");
  });
  it("matches rosu to Trandafir roșu", () => {
    expect(
      initialStock.filter((item) => textIncludes(item.name, "rosu")).map((item) => item.name),
    ).toEqual(["Trandafir roșu"]);
    expect(textEquals("trandafir rosu", "Trandafir roșu")).toBe(true);
  });
  it("matches marinescu to Ioana Marinescu", () => {
    expect(textIncludes("Ioana Marinescu", "  marinescu  ")).toBe(true);
    expect(textIncludes("Ioana Marinescu", "popescu")).toBe(false);
  });
  it.each(["frezie", "FREZIE"])("matches %s to Frezie", (query) => {
    expect(
      initialStock.filter((item) => textIncludes(item.name, query)).map((item) => item.name),
    ).toEqual(["Frezie"]);
  });
  it("matches status filters without diacritics", () => {
    expect(textEquals("asteapta clientul", "Așteaptă clientul")).toBe(true);
    expect(textEquals("confirmata", "Confirmată")).toBe(true);
    expect(textEquals("confirmata", "Draft")).toBe(false);
  });
  it("never changes original product text for display", () => {
    const order = initialOrders[0];
    if (!order) throw new Error("Missing order fixture");
    const original = "  Trandafir ROSU  ";
    expect(productSummary({ ...order, products: [{ name: original, quantity: 2 }] })).toBe(
      `2 ${original}`,
    );
    expect(original).toBe("  Trandafir ROSU  ");
  });
});
