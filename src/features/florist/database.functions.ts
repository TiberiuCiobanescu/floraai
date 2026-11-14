import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mapFloristRows, type FloristRows, technicalValue, orderStatusLabels, orderTypeLabels, messageStatusLabels } from "./database-mapping";
import { modificationDeadline, type Order, type OrderType } from "./data";
import { z } from "zod";
import { textEquals } from "@/lib/normalize-text";
import { assertOrderEditable } from "./order-safety";
import { editableMissingFields } from "./extraction-rules";

// Use the team's existing anon policies, never the service-role key.
export function databaseClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Conexiunea la date nu este configurată.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}
export async function readTable<K extends keyof FloristRows>(client: SupabaseClient<Database>, table: K): Promise<FloristRows[K]> {
  const rows: unknown[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from(table).select("*").range(offset, offset + 999);
    if (error) { console.error(`Read ${table}: ${error.message}`); throw new Error(`Nu s-a putut citi tabelul ${table}.`); }
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) break;
  }
  return rows as FloristRows[K];
}
export const getFloristData = createServerFn({ method: "GET" }).handler(async () => {
  const client = databaseClient();
  const [produse, stoc, clienti, livrari_furnizor, termene, comenzi, linii_comanda, mesaje] = await Promise.all([
    readTable(client, "produse"), readTable(client, "stoc"), readTable(client, "clienti"), readTable(client, "livrari_furnizor"),
    readTable(client, "termene"), readTable(client, "comenzi"), readTable(client, "linii_comanda"), readTable(client, "mesaje"),
  ]);
  return mapFloristRows({ produse, stoc, clienti, livrari_furnizor, termene, comenzi, linii_comanda, mesaje });
});
export type FloristData = Awaited<ReturnType<typeof getFloristData>>;
export const clientNameSchema = z.object({
  phone: z.string().min(1).max(30),
  name: z.string().min(1).max(200).refine(value => value.trim().length > 0, "Completează numele clientului."),
});
export const saveClientName = createServerFn({ method: "POST" })
  .inputValidator(clientNameSchema)
  .handler(async ({ data }) => {
    const { data: saved, error } = await databaseClient().from("clienti").update({ nume: data.name }).eq("telefon", data.phone).select("telefon,nume").single();
    if (error || !saved) throw new Error("Numele clientului nu a putut fi salvat.");
    return { phone: saved.telefon, name: saved.nume };
  });
const executionResultSchema = z.object({
  ok: z.boolean(),
  shortages: z.array(z.object({ flower: z.string(), missing: z.number().int().positive() })),
});
export const executeFloristOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1), version: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const { data: result, error } = await databaseClient().rpc("executa_comanda", {
      p_comanda: data.id, p_versiune: data.version,
    });
    if (error) {
      console.error("Execute order:", error.message);
      throw new Error(error.code === "P0001" ? error.message : "Comanda nu a putut fi executată. Stocul nu s-a modificat.");
    }
    return executionResultSchema.parse(result);
  });
export const validateFloristOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1), version: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const { error } = await databaseClient().rpc("valideaza_comanda", { p_comanda: data.id, p_versiune: data.version });
    if (error) throw new Error(error.message);
    return { saved: true };
  });
export const rejectFloristOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1), version: z.number().int().positive(), reason: z.string().trim().min(1).max(1000) }))
  .handler(async ({ data }) => {
    const { error } = await databaseClient().rpc("respinge_comanda", { p_comanda: data.id, p_versiune: data.version, p_motiv: data.reason });
    if (error) throw new Error(error.message);
    return { saved: true };
  });
export const decideCancellation = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1), version: z.number().int().positive(), accept: z.boolean() }))
  .handler(async ({ data }) => {
    const { error } = await databaseClient().rpc("decide_anulare_comanda", { p_comanda: data.id, p_versiune: data.version, p_accepta: data.accept });
    if (error) throw new Error(error.message);
    return { saved: true };
  });
const settingsSchema = z.object({
  limits: z.object({ "Buchet în oraș": z.number().int().min(0).max(720), "Nuntă": z.number().int().min(0).max(720) }),
  stock: z.array(z.object({ key: z.string().min(1), threshold: z.number().int().min(0) })),
});
export const saveFloristSettings = createServerFn({ method: "POST" }).inputValidator(settingsSchema).handler(async ({ data }) => {
  const client = databaseClient();
  for (const [label, hours] of Object.entries(data.limits)) {
    const { error } = await client.from("termene").update({ ore_inainte_de_livrare: hours }).eq("tip_comanda", technicalValue(orderTypeLabels, label)).select("tip_comanda").single();
    if (error) throw new Error("Termenul nu a putut fi salvat.");
  }
  for (const item of data.stock) {
    const { error } = await client.from("stoc").update({ prag_alerta: item.threshold }).eq("floare", item.key).select("floare").single();
    if (error) throw new Error("Pragul de stoc nu a putut fi salvat.");
  }
  return { saved: true };
});
const orderSchema = z.object({
  id: z.string().min(1), client: z.string(), phone: z.string(), type: z.enum(["Buchet în oraș", "Nuntă"]),
  date: z.string(), time: z.string(), address: z.string(), recipient: z.string(), note: z.string(),
  status: z.enum(["Draft", "Așteaptă clientul", "De validat", "Confirmată", "Respinsă", "Anulată", "În lucru", "Executată", "Livrată"]),
  extras: z.string(), versions: z.array(z.string()), question: z.string().optional(), version: z.number().optional(),
  missingFields: z.array(z.string()).optional(),
  products: z.array(z.object({ id: z.string().optional(), lineId: z.number().optional(), name: z.string(), quantity: z.number().int().positive(), extras: z.string().optional(), composition: z.string().optional() })),
});
export const saveFloristOrder = createServerFn({ method: "POST" }).inputValidator(orderSchema).handler(async ({ data }) => {
  const client = databaseClient();
  if (data.status === "Executată") throw new Error("Execuția cu scădere de stoc necesită o operație atomică în baza de date; nu s-a modificat comanda.");
  const catalog = await readTable(client, "produse");
  const products = data.products.map((line) => {
    const product = catalog.find((entry) => textEquals(entry.nume, line.name));
    if (!product) throw new Error(`Selectează un produs existent: ${line.name}`);
    return { ...line, id: product.id };
  });
  const termene = await readTable(client, "termene");
  const limits = Object.fromEntries(termene.map((row) => [orderTypeLabels[row.tip_comanda], row.ore_inainte_de_livrare])) as Record<OrderType, number>;
  const deadline = modificationDeadline(data as Order, limits);
  const { data: current, error: readError } = await client.from("comenzi").select("versiune,status").eq("id", data.id).single();
  if (readError || !current) throw new Error("Comanda nu a putut fi citită.");
  assertOrderEditable(current.status);
  const missingFields = editableMissingFields(data);
  if (data.status === "Confirmată" && missingFields.length) throw new Error("Completează câmpurile lipsă înainte de confirmare.");
  if (data.version !== undefined && data.version !== current.versiune) throw new Error("Comanda a fost modificată între timp. Reîncarcă datele înainte de salvare.");
  const { data: existingClient, error: clientReadError } = await client.from("clienti").select("tip").eq("telefon", data.phone).maybeSingle();
  if (clientReadError || !existingClient) throw new Error("Selectează un client existent înainte de salvare.");
  const { error: clientError } = await client.from("clienti").update({ nume: data.client, adresa: data.address }).eq("telefon", data.phone);
  if (clientError) throw new Error("Clientul nu a putut fi salvat.");
  const { error } = await client.from("comenzi").update({
    telefon: data.phone, tip_comanda: technicalValue(orderTypeLabels, data.type), data_livrare: data.date || null, interval: data.time || null,
    adresa: data.address, destinatar: data.recipient, bilet: data.note, status: technicalValue(orderStatusLabels, data.status),
    intrebare_client: data.question ?? null, versiune: current.versiune + 1,
    campuri_lipsa: missingFields,
    termen_modificare: Number.isFinite(deadline.getTime()) ? new Date(deadline.getTime() + 2 * 3600000).toISOString().slice(0, 19) : null,
  }).eq("id", data.id).eq("versiune", current.versiune).select("id").single();
  if (error) throw new Error("Comanda nu a putut fi salvată. Reîncarcă datele înainte de a reîncerca.");
  const existingLines = (await readTable(client, "linii_comanda")).filter((line) => line.comanda_id === data.id);
  for (const [index, line] of products.entries()) {
    const values = { comanda_id: data.id, produs_id: line.id, cantitate: line.quantity, auxiliare: index === 0 ? data.extras : line.extras ?? null };
    const existing = existingLines.find((entry) => entry.id === line.lineId);
    const result = existing
      ? await client.from("linii_comanda").update(values).eq("id", existing.id).eq("comanda_id", data.id)
      : await client.from("linii_comanda").insert(values);
    if (result.error) throw new Error("Produsele nu au putut fi salvate complet. Reîncarcă datele înainte de a reîncerca.");
  }
  for (const line of existingLines.filter((entry) => !products.some((product) => product.lineId === entry.id))) {
    const { error: deleteError } = await client.from("linii_comanda").delete().eq("id", line.id).eq("comanda_id", data.id);
    if (deleteError) throw new Error("Produsul nu a putut fi șters.");
  }
  return { saved: true };
});
export const saveMessageStatus = createServerFn({ method: "POST" }).inputValidator(z.object({ orderId: z.string(), status: z.string() })).handler(async ({ data }) => {
  const client = databaseClient();
  const { data: order, error: orderError } = await client.from("comenzi").select("status").eq("id", data.orderId).single();
  if (orderError || !order) throw new Error("Comanda mesajelor nu a putut fi citită.");
  assertOrderEditable(order.status);
  const { error } = await client.from("mesaje").update({ status: technicalValue(messageStatusLabels, data.status) }).eq("comanda_id", data.orderId).in("status", ["nou", "asteapta_client"]);
  if (error) throw new Error("Statusul mesajelor nu a putut fi salvat.");
  return { saved: true };
});