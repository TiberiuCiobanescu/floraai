import { normalizeText, textEquals } from "@/lib/normalize-text";
import { productSummary, type Message, type Order } from "./data";
import { newestMessagesFirst } from "./message-order";
import type { OrderObservation } from "./order-observations";

export type ClientQuestion = { label: string; template: string };

export function clientQuestionOptions(order: Order, messages: readonly Message[], observations: readonly OrderObservation[] = []): ClientQuestion[] {
  const questions: ClientQuestion[] = observations.map((observation) => ({ label: observation.title, template: observation.template }));
  const latest = newestMessagesFirst(messages.filter((message) => message.orderId === order.id))[0];
  const greeting = normalizeText(order.client) ? `Bună ziua, ${order.client}!` : "Bună ziua!";
  const deliveryDate = new Date(`${order.date}T12:00:00`);
  const date = Number.isFinite(deliveryDate.getTime()) ? deliveryDate.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) : "[completează data livrării]";
  const context = `Comanda #${order.id}: ${productSummary(order) || "[completează produsele]"}, pentru ${order.recipient || "[completează destinatarul]"}, cu livrare pe ${date}, ${order.time}${normalizeText(order.address) ? `, la ${order.address}` : ""}.`;
  const add = (label: string, body: string) => questions.push({ label, template: `${greeting}\n\n${context}\n\n${body}` });
  const fields = [
    [order.client, "Numele clientului", "Ne puteți spune numele dumneavoastră?"],
    [order.phone, "Număr de contact", "Ne puteți trimite un număr de telefon de contact?"],
    [order.address, "Adresa de livrare", "Ne puteți trimite adresa completă de livrare?"],
    [order.recipient, "Numele destinatarului", "Care este numele destinatarului?"],
    [order.date, "Data livrării", "Pentru ce dată doriți livrarea?"],
    [order.time, "Intervalul de livrare", "Ce interval orar preferați pentru livrare?"],
  ] as const;
  for (const [value, label, question] of fields) {
    if (!normalizeText(value)) add(label, question);
  }
  if (!order.products.length || order.products.some((product) => !normalizeText(product.name) || product.quantity < 1)) {
    add("Florile și cantitățile", "Ce flori sau aranjamente doriți și în ce cantitate?");
  }
  if (textEquals(order.status, "Livrată")) {
    add("Feedback după livrare", "Florile au ajuns în regulă? Cum vi s-au părut?");
    return questions;
  }
  if (latest && textEquals(latest.type, "Modificare")) {
    add("Confirmarea modificării comenzii", `Vă rugăm să confirmați modificarea comenzii la ${productSummary(order)}. Restul detaliilor rămân neschimbate?`);
  }
  if (textEquals(latest?.type ?? "", "Completare")) {
    add("Completarea detaliilor", "Mulțumim pentru completare! Mai sunt și alte detalii pe care doriți să le adăugați comenzii?");
  }
  if (textEquals(latest?.type ?? "", "Confirmare")) {
    add("Confirmarea detaliilor comenzii", "Confirmați că toate detaliile din rezumatul comenzii sunt corecte?");
  }
  if (textEquals(order.type, "Nuntă")) {
    add("Bugetul pentru nuntă", "Ce buget aveți în vedere pentru aranjamentele de nuntă?");
    add("Preferințe pentru aranjamente", "Aveți o paletă de culori sau fotografii de referință pentru aranjamente?");
  } else if (textEquals(latest?.type ?? "", "Întrebare de preț")) {
    add("Bugetul pentru buchet", "Ce buget aveți în vedere pentru buchet?");
  }
  if (!normalizeText(order.note) && !textEquals(order.type, "Nuntă")) {
    add("Textul bilețelului", "Doriți să adăugăm un mesaj pe bilețel? Ce text să scriem?");
  }
  if (order.date && order.time) {
    add("Confirmarea livrării", "Vă rugăm să confirmați datele livrării de mai sus. Sunt corecte aceste detalii?");
  }
  return questions;
}

export function recommendedClientQuestions(order: Order, messages: readonly Message[], observations: readonly OrderObservation[] = []): string[] {
  return clientQuestionOptions(order, messages, observations).map((question) => question.template);
}