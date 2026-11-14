import { normalizeText, textEquals } from "@/lib/normalize-text";
import { DEMO_NOW, modificationDeadline, type Order, type OrderType } from "./data";

type StockItem = { name: string; quantity: number };
export type OrderObservation = { kind: "deadline" | "shortage" | "unknown"; title: string; detail: string; template: string };

// Explicit flower aliases only: a bouquet/arrangement has no known stem recipe.
const aliases: Record<string, string> = {
  "trandafiri rosii": "trandafir rosu", "trandafiri albi": "trandafir alb",
  lalele: "lalea", "frezii albe": "frezie", frezii: "frezie",
  crini: "crin", bujori: "bujor", "gerbera roz": "gerbera",
  eustoma: "lisianthus",
};

export function orderObservations(order: Order, stock: readonly StockItem[], limits: Record<OrderType, number>, now = DEMO_NOW): OrderObservation[] {
  if (textEquals(order.status, "Livrată") || textEquals(order.status, "Executată")) return [];
  const observations: OrderObservation[] = [];
  const deadline = modificationDeadline(order, limits);
  if (Number.isFinite(deadline.getTime())) {
    const formatted = deadline.toLocaleString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const expired = deadline < now;
    observations.push({
      kind: "deadline",
      title: expired ? "Termenul de modificare a trecut" : "Termenul de modificare este deschis",
      detail: expired ? `Termen: ${formatted}. Verifică posibilitatea modificării înainte de a o promite clientului.` : `Modificările pot fi discutate până la ${formatted}, cu ${limits[order.type]} ore înainte de livrare.`,
      template: expired
        ? `Bună ziua! Pentru comanda #${order.id}, termenul de modificare (${formatted}) a trecut. Verificăm dacă solicitarea mai poate fi realizată. Varianta pe care v-o putem propune este: [completează după verificare]. Este potrivită pentru dumneavoastră?`
        : `Bună ziua! Pentru comanda #${order.id}, termenul de modificare este ${formatted}. Doriți să mai ajustăm vreun detaliu înainte de acest termen?`,
    });
  }
  const demand = new Map<StockItem, number>();
  const unknown = new Set<string>();
  for (const product of order.products) {
    const name = normalizeText(product.name);
    if (!name || product.quantity < 1) continue;
    const canonical = aliases[name] ?? name;
    const item = stock.find((entry) => normalizeText(entry.name) === canonical);
    if (item) demand.set(item, (demand.get(item) ?? 0) + product.quantity);
    else unknown.add(product.name);
  }
  for (const [item, needed] of demand) {
    if (needed <= item.quantity) continue;
    observations.push({
      kind: "shortage", title: `Stoc insuficient: ${item.name}`,
      detail: `Necesar: ${needed} fire · În stoc: ${item.quantity} fire · Lipsesc: ${needed - item.quantity} fire.`,
      template: `Bună ziua! Pentru comanda #${order.id}, sunt necesare ${needed} fire de ${item.name.toLocaleLowerCase("ro-RO")}, iar în stoc avem ${item.quantity}. Ne lipsesc ${needed - item.quantity} fire. Vă propunem [completează florile alternative și cantitatea] sau [completează o altă variantă verificată]. Ce variantă preferați?`,
    });
  }
  for (const name of unknown) {
    observations.push({
      kind: "unknown", title: `Stoc de verificat: ${name}`,
      detail: "Produsul nu are o corespondență directă în stoc. Verifică florile și numărul de fire necesare; disponibilitatea nu poate fi stabilită automat.",
      template: `Bună ziua! Verificăm disponibilitatea florilor pentru „${name}” din comanda #${order.id}. Vă putem propune [completează compoziția verificată și cantitățile]. Este potrivită pentru dumneavoastră?`,
    });
  }
  return observations;
}