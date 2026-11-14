import type { ExtractedOrder } from "./extraction-schema";
export function mandatoryFields(result: ExtractedOrder) {
  if (result.tip_mesaj === "altceva" || result.tip_mesaj === "intrebare_pret") return [];
  return [...new Set([...result.campuri_lipsa,
    ...(!result.produse.length ? ["produse"] : []),
    ...(!result.data_livrare ? ["data_livrare"] : []),
    ...(!result.adresa?.trim() ? ["adresa"] : []),
    ...(!result.destinatar?.trim() ? ["destinatar"] : []),
  ])];
}
export function editableMissingFields(order: { date: string; address: string; recipient: string; products: { name: string; quantity: number }[]; missingFields?: string[] }) {
  return [...new Set([
    ...(!order.date ? ["data_livrare"] : []),
    ...(!order.address.trim() ? ["adresa"] : []),
    ...(!order.recipient.trim() ? ["destinatar"] : []),
    ...(!order.products.length || order.products.some(p => !p.name.trim() || p.quantity < 1) ? ["produse"] : []),
    ...(order.missingFields ?? []).filter(f => !["data_livrare", "adresa", "destinatar", "produse"].includes(f)),
  ])];
}