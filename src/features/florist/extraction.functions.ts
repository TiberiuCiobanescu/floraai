import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { databaseClient, readTable } from "./database.functions";
import { parseWhatsApp, groupMessages, phoneKey, validPhone } from "./whatsapp";

export const sendSimulatorMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ phone: z.string().min(1).max(30), text: z.string().min(1).max(5000).refine((value) => value.trim().length > 0) }))
  .handler(async ({ data }) => {
    if (!validPhone(data.phone) || !/^\+40\d{9}$/.test(data.phone.trim())) throw new Error("Folosește un telefon românesc în formatul +40…");
    const client = databaseClient();
    const existingClient = await client.from("clienti").select("telefon").eq("telefon", data.phone.trim()).maybeSingle();
    if (existingClient.error) throw new Error("Clientul nu a putut fi verificat.");
    if (!existingClient.data) {
      const { error } = await client.from("clienti").insert({ telefon: data.phone.trim(), nume: data.phone.trim(), tip: "persoana" });
      if (error) throw new Error("Clientul nou nu a putut fi salvat.");
    }
    const { data: saved, error } = await client.from("mesaje").insert({
      telefon: data.phone.trim(), ora: "2026-11-14 10:05:00", text: data.text,
      canal: "WhatsApp", status: "nou", directie: "client",
    }).select("id").single();
    if (error || !saved) throw new Error("Mesajul nu a putut fi salvat.");
    return saved;
  });
export const ensureExtractionReply = createServerFn({ method: "POST" })
  .inputValidator(z.object({ ids: z.array(z.string()).min(1).max(500) }))
  .handler(async ({ data }) => {
    const { error } = await databaseClient().rpc("raspunde_eroare_extragere", { p_mesaje: data.ids });
    if (error) throw new Error("Răspunsul automat nu a putut fi salvat. Mesajul rămâne în Inbox.");
    return { saved: true };
  });

export const prepareExtraction = createServerFn({ method: "POST" })
  .inputValidator(z.object({ text: z.string().min(1).max(2000000), channel: z.enum(["WhatsApp", "Fizic", "Telefon"]), phone: z.string().optional() }))
  .handler(async ({ data }) => {
    const incoming = data.channel === "WhatsApp" ? parseWhatsApp(data.text) : [{ telefon: data.phone ?? "", ora: "2026-11-14 10:05:00", text: data.text }];
    if (incoming.some(m => !validPhone(m.telefon))) throw new Error("Completează telefonul clientului.");
    const client = databaseClient();
    const clients = await readTable(client, "clienti");
    const existing = await readTable(client, "mesaje");
    const pending: (typeof existing[number])[] = [];
    let skipped = 0;
    for (const message of incoming) {
      const savedPhone = clients.find(c => phoneKey(c.telefon) === phoneKey(message.telefon))?.telefon ?? `+${phoneKey(message.telefon)}`;
      if (!/^\+40\d{9}$/.test(savedPhone)) throw new Error("Baza echipei acceptă telefoane românești: 07… sau +40….");
      const duplicate = existing.find(m => m.directie === "client" && phoneKey(m.telefon) === phoneKey(savedPhone) && m.ora.replace("T", " ").slice(0,19) === message.ora && m.text === message.text && m.canal?.toLowerCase() === data.channel.toLowerCase());
      if (duplicate) {
        if (!duplicate.tip_mesaj && duplicate.status === "nou") pending.push(duplicate);
        else skipped++;
        continue;
      }
      const { data: saved, error } = await client.from("mesaje").insert({ ...message, telefon: savedPhone, canal: data.channel, status: "nou" }).select().single();
      if (error || !saved) throw new Error(error?.message ?? "Mesajul nu a putut fi salvat.");
      existing.push(saved); pending.push(saved);
    }
    return { groups: groupMessages(pending.map(m => ({ ...m, ora: m.ora.replace("T", " ").slice(0,19) }))).map(g => g.map(m => m.id)), skipped };
  });