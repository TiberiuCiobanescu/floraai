import { textEquals } from "@/lib/normalize-text";
import type { Product } from "./data";

export function assertOrderEditable(status: string) {
  if (["executata", "livrata", "anulata", "Executată", "Livrată", "Anulată"].some((value) => textEquals(value, status))) {
    throw new Error("Comenzile executate, livrate sau anulate nu pot fi modificate.");
  }
}

export function changeProductName(product: Product, name: string, catalog: readonly { id: string; nume: string; compozitie: string }[]): Product {
  const match = catalog.find((entry) => textEquals(entry.nume, name));
  return { ...product, name, id: match?.id ?? "", composition: match?.compozitie ?? "" };
}