import { NoObjectGeneratedError, APICallError } from "ai";
import { z } from "zod";
import { databaseClient, readTable } from "../database.functions";
import { EXTRACTION_INSTRUCTIONS } from "./instructions.server";
import { createResponsesCall } from "./responses.server";
import { mandatoryFields } from "../extraction-rules";
import { textEquals } from "@/lib/normalize-text";

export async function extractGroup(request: Request, ids: string[]) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI-ul integrat nu este configurat.");
  const client = databaseClient();
  const [catalog, clients, orders, lines, allMessages] = await Promise.all([readTable(client,"produse"),readTable(client,"clienti"),readTable(client,"comenzi"),readTable(client,"linii_comanda"),readTable(client,"mesaje")]);
  const denial = allMessages.find(m => m.intrebare_client?.startsWith("AI_ACCESS_DENIED:"));
  if (denial) throw new Error(denial.intrebare_client?.slice(17) ?? "Accesul AI este oprit.");
  const messages = ids.map(id => allMessages.find(m => m.id === id));
  const first = messages[0];
  if (!first || messages.some(m => !m || m.telefon !== first.telefon || m.directie !== "client" || m.tip_mesaj || !["nou","asteapta_client"].includes(m.status))) throw new Error("Mesajele nu pot fi procesate. Reîncarcă Inbox.");
  const customer = clients.find(c => c.telefon === first.telefon);
  const openOrder = orders.filter(o => o.telefon === first.telefon && !["executata","livrata"].includes(o.status)).sort((a,b) => b.id.localeCompare(a.id,undefined,{numeric:true}))[0];
  const csv = ["id,nume,pret_lei,tip,compozitie,sinonime", ...catalog.map(p => [p.id,p.nume,p.pret_lei,p.tip,p.compozitie,p.sinonime ?? ""].map(v => `"${String(v).replaceAll('"','""')}"`).join(","))].join("\n");
  const context = `DATA CURENTA: 2026-11-14 (sambata)\nCATALOG:\n${csv}\nCLIENTUL:\n${customer ? JSON.stringify(customer) : "client nou"}\nCOMANDA DESCHISA A CLIENTULUI:\n${openOrder ? JSON.stringify({ ...openOrder, produse: lines.filter(l => l.comanda_id === openOrder.id).map(l => ({ nume_catalog: catalog.find(p => p.id === l.produs_id)?.nume, cantitate:l.cantitate })) }) : "niciuna"}\nMESAJ (telefon, ora, text):\n${messages.map(m => JSON.stringify(m && {telefon:m.telefon,ora:m.ora,text:m.text})).join("\n")}`;
  try {
    const { result } = createResponsesCall(request, {baseURL:"https://ai.gateway.lovable.dev/v1", apiKey:key, model:"openai/gpt-6-astra"}, [{role:"user",content:context}], EXTRACTION_INSTRUCTIONS);
    const output = await result.output;
    if (await result.finishReason === "content-filter") throw new Error("AI-ul a refuzat procesarea acestui mesaj.");
    if (!output) throw new Error("AI-ul nu a returnat o comandă validă.");
    output.telefon = first.telefon;
    output.campuri_lipsa = mandatoryFields(output);
    if (output.data_livrare && !/^\d{4}-\d{2}-\d{2}$/.test(output.data_livrare)) throw new Error("AI-ul a returnat o dată invalidă.");
    if (output.interval && !/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(output.interval)) throw new Error("AI-ul a returnat un interval invalid.");
    for (const product of output.produse) {
      const entry = catalog.find(p => textEquals(p.nume,product.nume_catalog));
      if (!entry || !Number.isInteger(product.cantitate) || product.cantitate < 1) throw new Error("Produsul extras nu corespunde catalogului. Verifică mesajul.");
      product.nume_catalog = entry.nume;
    }
    const {data: orderId,error} = await client.rpc("aplica_extragere_comanda",{p_mesaje:ids,p_rezultat:output,p_comanda:openOrder?.id ?? "",p_versiune:openOrder?.versiune ?? 0});
    if (error) throw new Error(error.message);
    return {orderId,type:output.tip_mesaj};
  } catch(error) {
    if (APICallError.isInstance(error)) {
      let safe = error.message;
      try { const body = JSON.parse(error.responseBody ?? "{}"); safe = body.message ?? body.error?.message ?? safe; } catch { /* no JSON body */ }
      if (error.statusCode === 403) await client.from("mesaje").update({intrebare_client:`AI_ACCESS_DENIED:${safe}`}).eq("id",first.id);
      throw new Error(safe);
    }
    if (NoObjectGeneratedError.isInstance(error)) throw new Error("AI-ul nu a returnat date valide. Mesajul este păstrat în Inbox.");
    throw error;
  }
}
export function handleExtraction(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(JSON.stringify(data)+"\n"));
      const heartbeat = setInterval(() => { if (!request.signal.aborted) send({waiting:true}); },5000);
      try {
        const {ids} = z.object({ids:z.array(z.string()).min(1).max(500)}).parse(await request.json());
        send({waiting:true});
        const result = await extractGroup(request,ids);
        send({done:true,...result});
      } catch(error) {
        send({error: error instanceof Error ? error.message : "Mesajul nu a putut fi procesat."});
      } finally {clearInterval(heartbeat); controller.close();}
    },
  });
  return new Response(stream,{headers:{"Content-Type":"application/x-ndjson","Cache-Control":"no-cache, no-transform"}});
}