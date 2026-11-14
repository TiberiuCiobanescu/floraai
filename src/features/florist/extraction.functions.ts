import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { databaseClient, readTable } from "./database.functions";
import { parseWhatsApp, groupMessages, phoneKey, validPhone } from "./whatsapp";

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
      const duplicate = existing.find(m => phoneKey(m.telefon) === phoneKey(savedPhone) && m.ora.replace("T", " ").slice(0,19) === message.ora && m.text === message.text && m.canal?.toLowerCase() === data.channel.toLowerCase());
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