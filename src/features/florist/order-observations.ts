import { parseComposition } from "./database-mapping";
import { normalizeText, textEquals } from "@/lib/normalize-text";
import { DEMO_NOW, modificationDeadline, productSummary, type Order, type OrderType, type Message } from "./data";

type StockItem = { name: string; quantity: number; key?: string };
export type OrderObservation = { kind: "deadline" | "shortage" | "unknown"; title: string; detail: string; template: string };

// Explicit flower aliases only: a bouquet/arrangement has no known stem recipe.
const aliases: Record<string, string> = {
  "trandafiri rosii": "trandafir rosu", "trandafiri albi": "trandafir alb",
  lalele: "lalea", "frezii albe": "frezie", frezii: "frezie",
  crini: "crin", bujori: "bujor", "gerbera roz": "gerbera",

};

export function orderObservations(order: Order, stock: readonly StockItem[], limits: Record<OrderType, number>, now = DEMO_NOW, _messages: readonly Message[] = []): OrderObservation[] {
  if (textEquals(order.status, "Livrată") || textEquals(order.status, "Executată")) return [];
  const observations: OrderObservation[] = [];
  const greeting = normalizeText(order.client) ? `Bună ziua, ${order.client}!` : "Bună ziua!";
  const delivery = new Date(`${order.date}T12:00:00`);
  const deliveryDate = Number.isFinite(delivery.getTime()) ? delivery.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) : "[completează data livrării]";
  const context = `Comanda #${order.id}: ${productSummary(order) || "[completează produsele]"}, pentru ${order.recipient || "[completează destinatarul]"}, cu livrare pe ${deliveryDate}, ${order.time}${normalizeText(order.address) ? `, la ${order.address}` : ""}.`;
  const deadline = modificationDeadline(order, limits);
  if (Number.isFinite(deadline.getTime())) {
    const formatted = deadline.toLocaleString("ro-RO", { day: "numeric", month: "short", timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" });
    const expired = deadline < now;
    observations.push({
      kind: "deadline",
      title: expired ? "Termenul de modificare a trecut" : "Termenul de modificare este deschis",
      detail: expired ? `Termen: ${formatted}. Verifică posibilitatea modificării înainte de a o promite clientului.` : `Modificările pot fi discutate până la ${formatted}, cu ${limits[order.type]} ore înainte de livrare.`,
      template: expired
        ? `${greeting}\n\n${context}\n\nTermenul de modificare a fost ${formatted} și a trecut. Trebuie să verificăm dacă mai putem realiza modificarea solicitată înainte de a o confirma. Doriți să verificăm această posibilitate?`
        : `${greeting}\n\n${context}\n\nTermenul de modificare este ${formatted}. Doriți să mai ajustăm vreun detaliu înainte de acest termen?`,
    });
  }
  const demand = new Map<StockItem, number>();
  const unknown = new Set<string>();
  for (const product of order.products) {
    const name = normalizeText(product.name);
    if (!name || product.quantity < 1) continue;
    if (product.composition) {
      try {
        const stems = parseComposition(product.composition);
        if (normalizeText(product.extras ?? "").includes("verdeata")) stems.push({ flower: "eucalipt", stems: 3 });
        for (const stem of stems) {
          const item = stock.find((entry) => normalizeText(entry.key ?? entry.name) === normalizeText(stem.flower));
          if (item) demand.set(item, (demand.get(item) ?? 0) + stem.stems * product.quantity);
          else unknown.add(stem.flower);
        }
      } catch { unknown.add(product.name); }
      continue;
    }
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
      template: `${greeting}\n\n${context}\n\nPentru ${item.name.toLocaleLowerCase("ro-RO")}, sunt necesare ${needed} fire, iar în stoc avem ${item.quantity}. Ne lipsesc ${needed - item.quantity} fire.\n\nVă propunem [completează florile alternative și cantitatea] sau [completează o altă variantă verificată]. Ce variantă preferați?`,
    });
  }
  for (const name of unknown) {
    observations.push({
      kind: "unknown", title: `Stoc de verificat: ${name}`,
      detail: "Produsul nu are o corespondență directă în stoc. Verifică florile și numărul de fire necesare; disponibilitatea nu poate fi stabilită automat.",
      template: `${greeting}\n\n${context}\n\nVerificăm disponibilitatea florilor pentru „${name}”. Vă putem propune [completează compoziția verificată și cantitățile]. Este potrivită pentru dumneavoastră?`,
    });
  }
  return observations;
}