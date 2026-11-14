import type { Tables } from "@/integrations/supabase/types";
import { textEquals } from "@/lib/normalize-text";
import type { Message, Order, OrderStatus, OrderType } from "./data";

export type FloristRows = {
  produse: Tables<"produse">[];
  stoc: Tables<"stoc">[];
  clienti: Tables<"clienti">[];
  livrari_furnizor: Tables<"livrari_furnizor">[];
  termene: Tables<"termene">[];
  comenzi: Tables<"comenzi">[];
  linii_comanda: Tables<"linii_comanda">[];
  mesaje: Tables<"mesaje">[];
};

export const orderStatusLabels: Record<string, OrderStatus> = {
  draft: "Draft", asteapta_client: "Așteaptă clientul", asteapta_validare: "De validat", confirmata: "Confirmată",
  respinsa: "Respinsă", in_lucru: "În lucru", executata: "Executată", livrata: "Livrată",
};
export const orderTypeLabels: Record<string, OrderType> = { buchet_oras: "Buchet în oraș", nunta: "Nuntă" };
export const messageStatusLabels: Record<string, string> = {
  nou: "Nou", asteapta_client: "Așteaptă clientul", confirmat: "Confirmat", ignorat: "Ignorat",
};
export const messageTypeLabels: Record<string, string> = {
  comanda_noua: "Comandă nouă", modificare: "Modificare", completare: "Completare",
  confirmare: "Confirmare", intrebare_pret: "Întrebare de preț", recomandare: "Recomandare", altceva: "Altceva",
};
export function technicalValue(labels: Record<string, string>, value: string) {
  const match = Object.entries(labels).find(([, label]) => textEquals(label, value));
  if (!match) throw new Error(`Valoare necunoscută: ${value}`);
  return match[0];
}
const flowerLabels: Record<string, string> = {
  "trandafir rosu": "Trandafir roșu", "trandafir alb": "Trandafir alb", "trandafir roz": "Trandafir roz",
};
export function flowerLabel(value: string) {
  return flowerLabels[value] ?? `${value.charAt(0).toLocaleUpperCase("ro-RO")}${value.slice(1)}`;
}
export function parseComposition(value: string): { flower: string; stems: number }[] {
  return value.split(";").filter((part) => part.trim()).map((part) => {
    const separator = part.lastIndexOf(":");
    const flower = part.slice(0, separator).trim();
    const stems = Number(part.slice(separator + 1));
    if (separator < 1 || !Number.isInteger(stems) || stems <= 0) throw new Error("Compoziție de produs invalidă.");
    return { flower, stems };
  });
}
export function mapFloristRows(rows: FloristRows) {
  const limits = {} as Record<OrderType, number>;
  for (const row of rows.termene) {
    const type = orderTypeLabels[row.tip_comanda];
    if (type) limits[type] = row.ore_inainte_de_livrare;
  }
  if (limits["Buchet în oraș"] === undefined || limits.Nuntă === undefined) throw new Error("Lipsesc termenele din tabelul termene.");
  const orders: Order[] = rows.comenzi.map((row) => {
    const client = rows.clienti.find((entry) => entry.telefon === row.telefon);
    const lines = rows.linii_comanda.filter((line) => line.comanda_id === row.id);
    return {
      id: row.id, client: client?.nume ?? row.telefon, phone: row.telefon,
      type: orderTypeLabels[row.tip_comanda ?? ""] ?? "Buchet în oraș",
      products: lines.map((line) => {
        const product = rows.produse.find((entry) => entry.id === line.produs_id);
        return { id: line.produs_id, lineId: line.id, name: product?.nume ?? line.produs_id, quantity: line.cantitate, composition: product?.compozitie ?? "", extras: line.auxiliare ?? "" };
      }),
      extras: lines.map((line) => line.auxiliare).filter(Boolean).join("; "),
      date: row.data_livrare ?? "", time: row.interval ?? "", address: row.adresa ?? "",
      recipient: row.destinatar ?? "", note: row.bilet ?? "", status: orderStatusLabels[row.status] ?? "Draft",
      versions: [`v${row.versiune}`], version: row.versiune, question: row.intrebare_client ?? "",
      warning: row.avertisment ?? "", missingFields: row.campuri_lipsa ?? [],
    };
  });
  const messages: Message[] = rows.mesaje.map((row) => ({
    id: row.id, orderId: row.comanda_id ?? "", phone: row.telefon,
    client: rows.clienti.find((client) => client.telefon === row.telefon)?.nume ?? row.telefon,
    received: row.ora, time: row.ora.slice(11, 16), text: row.text,
    channel: textEquals(row.canal ?? "", "telefon") ? "Telefon" : textEquals(row.canal ?? "", "fizic") ? "Fizic" : "WhatsApp",
    type: messageTypeLabels[row.tip_mesaj ?? ""] ?? row.tip_mesaj ?? "Altceva",
    status: messageStatusLabels[row.status] ?? row.status,
    direction: row.directie === "florarie" ? "florarie" : "client",
    question: row.intrebare_client?.startsWith("AI_ACCESS_DENIED:") ? "" : row.intrebare_client ?? "",
  }));
  return { orders, messages, limits, catalog: rows.produse,
    clients: rows.clienti.map((row) => ({ phone: row.telefon, name: row.nume })),
    stock: rows.stoc.map((row) => ({ key: row.floare, name: flowerLabel(row.floare), quantity: row.cantitate_fire, threshold: row.prag_alerta })),
    deliveries: rows.livrari_furnizor.filter((row) => row.receptionat === "nu"),
  };
}