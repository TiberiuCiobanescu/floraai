import { describe, expect, it } from "vitest";
import { mapFloristRows, orderStatusLabels, parseComposition, type FloristRows } from "@/features/florist/database-mapping";
import { DEMO_NOW, isLowStock } from "@/features/florist/data";

describe("Connected database mapping", () => {
  const rows: FloristRows = {
    produse: [], clienti: [], comenzi: [], linii_comanda: [], mesaje: [], livrari_furnizor: [],
    termene: [{ tip_comanda: "buchet_oras", ore_inainte_de_livrare: 3 }, { tip_comanda: "nunta", ore_inainte_de_livrare: 72 }],
    stoc: ["trandafir rosu", "trandafir alb", "trandafir roz", "lalea", "frezie", "bujor", "crin", "gerbera", "eustoma", "gypsophila", "eucalipt"].map((floare) => ({ floare, cantitate_fire: floare === "trandafir rosu" ? 75 : 20, prag_alerta: 20, populara: "nu" })),
  };
  it("maps all 11 database flowers without adding fallback flowers", () => {
    expect(mapFloristRows(rows).stock).toHaveLength(11);
    expect(mapFloristRows({ ...rows, stoc: [] }).stock).toEqual([]);
  });
  it("keeps the database value of 75 red rose stems", () => {
    expect(mapFloristRows(rows).stock.find((item) => item.key === "trandafir rosu")?.quantity).toBe(75);
  });
  it("leaves the empty message table empty", () => {
    expect(mapFloristRows(rows).messages).toEqual([]);
  });
  it("uses the fixed Romanian demo time of 14 November 2026 at 10:05", () => {
    expect(DEMO_NOW.toISOString()).toBe("2026-11-14T08:05:00.000Z");
  });
  it("alerts at or below the database threshold", () => {
    expect(isLowStock({ quantity: 20, threshold: 20 })).toBe(true);
    expect(isLowStock({ quantity: 21, threshold: 20 })).toBe(false);
  });
  it("maps florist validation statuses to the Romanian workflow labels", () => {
    expect(orderStatusLabels["asteapta_validare"]).toBe("De validat");
    expect(orderStatusLabels["respinsa"]).toBe("Respinsă");
    expect(orderStatusLabels["anulata"]).toBe("Anulată");
  });
  it("reads stem counts from real product composition format", () => {
    expect(parseComposition("trandafir rosu:15;eucalipt:3")).toEqual([{ flower: "trandafir rosu", stems: 15 }, { flower: "eucalipt", stems: 3 }]);
  });
});