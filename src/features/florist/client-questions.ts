import { normalizeText, textEquals } from "@/lib/normalize-text";
import { productSummary, type Message, type Order } from "./data";
import { newestMessagesFirst } from "./message-order";
import type { OrderObservation } from "./order-observations";

export function recommendedClientQuestions(order: Order, messages: readonly Message[], observations: readonly OrderObservation[] = []): string[] {
  const questions: string[] = observations.map((observation) => observation.template);
  const latest = newestMessagesFirst(messages.filter((message) => message.orderId === order.id))[0];
  const greeting = normalizeText(order.client) ? `Bună ziua, ${order.client}!` : "Bună ziua!";
  const deliveryDate = new Date(`${order.date}T12:00:00`);
  const date = Number.isFinite(deliveryDate.getTime()) ? deliveryDate.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) : "[completează data livrării]";
  const context = `Comanda #${order.id}: ${productSummary(order) || "[completează produsele]"}, pentru ${order.recipient || "[completează destinatarul]"}, cu livrare pe ${date}, ${order.time}${normalizeText(order.address) ? `, la ${order.address}` : ""}.`;
  const fields = [
    [order.client, "Ne puteți spune numele dumneavoastră?"],
    [order.phone, "Ne puteți trimite un număr de telefon de contact?"],
    [order.address, "Ne puteți trimite adresa completă de livrare?"],
    [order.recipient, "Care este numele destinatarului?"],
    [order.date, "Pentru ce dată doriți livrarea?"],
    [order.time, "Ce interval orar preferați pentru livrare?"],
  ];
  for (const [value, question] of fields) {
    if (value !== undefined && question && !normalizeText(value)) questions.push(question);
  }
  if (!order.products.length || order.products.some((product) => !normalizeText(product.name) || product.quantity < 1)) {
    questions.push("Ce flori sau aranjamente doriți și în ce cantitate?");
  }
  if (textEquals(order.status, "Livrată")) {
    questions.push("Buchetul a ajuns în regulă? Cum vi s-a părut?");
    return questions;
  }
  if (latest && textEquals(latest.type, "Modificare")) {
    questions.push(`${greeting}\n\n${context}\n\nReferitor la solicitarea dumneavoastră: „${latest.text}”.\nVă rugăm să confirmați modificarea comenzii la ${productSummary(order)}. Restul detaliilor rămân neschimbate?`);
  }
  if (textEquals(latest?.type ?? "", "Completare")) {
    questions.push("Mulțumim pentru completare! Mai sunt și alte detalii pe care doriți să le adăugați comenzii?");
  }
  if (textEquals(latest?.type ?? "", "Confirmare")) {
    questions.push("Confirmați că toate detaliile din rezumatul comenzii sunt corecte?");
  }
  if (textEquals(order.type, "Nuntă")) {
    questions.push("Ce buget aveți în vedere pentru aranjamentele de nuntă?", "Aveți o paletă de culori sau fotografii de referință pentru aranjamente?");
  } else if (textEquals(latest?.type ?? "", "Întrebare de preț")) {
    questions.push("Ce buget aveți în vedere pentru buchet?");
  }
  if (!normalizeText(order.note) && !textEquals(order.type, "Nuntă")) {
    questions.push("Doriți să adăugăm un mesaj pe bilețel? Ce text să scriem?");
  }
  if (order.date && order.time) {
    questions.push(`${greeting}\n\n${context}\n\nVă rugăm să confirmați livrarea pe ${date}, în intervalul ${order.time}${normalizeText(order.address) ? `, la ${order.address}` : ""}, pentru ${order.recipient || "[completează destinatarul]"}. Sunt corecte aceste detalii?`);
  }
  return questions;
}