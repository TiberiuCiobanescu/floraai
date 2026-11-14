export type IncomingMessage = { telefon: string; ora: string; text: string };
export function phoneKey(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits.startsWith("0") && digits.length === 10 ? `4${digits}` : digits;
}
export function validPhone(value: string) {
  return /^\+?[\d\s().-]+$/.test(value.trim()) && /^\d{9,15}$/.test(phoneKey(value));
}
export function parseWhatsApp(value: string): IncomingMessage[] {
  const messages: IncomingMessage[] = [];
  for (const line of value.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const match = /^(\d{2}\.\d{2}\.\d{4}), (\d{2}:\d{2}) - ([^:]+): (.*)$/.exec(line);
    if (!match) {
      const previous = messages.at(-1);
      if (previous) previous.text += `\n${line}`;
      continue;
    }
    const [, date = "", time = "", telefon = "", text = ""] = match;
    const [day, month, year] = date.split(".");
    const ora = `${year}-${month}-${day} ${time}:00`;
    const parsed = new Date(ora.replace(" ", "T") + "+02:00");
    if (!validPhone(telefon)) throw new Error(`Expeditorul „${telefon}” nu este un telefon valid. Exportă conversația cu numerele clienților.`);
    if (!Number.isFinite(parsed.getTime()) || new Date(parsed.getTime() + 2 * 3600000).toISOString().slice(0, 16) !== `${year}-${month}-${day}T${time}`) throw new Error(`Data mesajului este invalidă: ${date}, ${time}.`);
    messages.push({ telefon: telefon.trim(), ora, text });
  }
  if (!messages.length) throw new Error("Fișierul nu conține mesaje în formatul ZZ.LL.AAAA, HH:MM - TELEFON: TEXT.");
  return messages;
}
export function groupMessages<T extends IncomingMessage>(messages: T[]): T[][] {
  const groups: T[][] = [];
  for (const message of messages) {
    const group = groups.at(-1);
    const previous = group?.at(-1);
    const gap = previous ? new Date(message.ora.replace(" ", "T") + "+02:00").getTime() - new Date(previous.ora.replace(" ", "T") + "+02:00").getTime() : Infinity;
    if (group && previous && phoneKey(previous.telefon) === phoneKey(message.telefon) && gap >= 0 && gap <= 10 * 60000) group.push(message);
    else groups.push([message]);
  }
  return groups;
}
export function whatsappUrl(phone: string, text: string) {
  if (!validPhone(phone)) throw new Error("Completează un telefon valid înainte de trimitere.");
  return `https://wa.me/${phoneKey(phone)}?text=${encodeURIComponent(text)}`;
}