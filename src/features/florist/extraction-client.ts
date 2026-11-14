import { ensureExtractionReply } from "./extraction.functions";

export async function processExtraction(ids:string[], signal:AbortSignal) {
  try {
  const response = await fetch("/api/extrage-comanda",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids}),signal});
  if (!response.ok || !response.body) throw new Error("Procesarea AI nu este disponibilă.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer="", complete=false;
  while (true) {
    const {done,value} = await reader.read();
    buffer+=decoder.decode(value,{stream:!done});
    let newline=buffer.indexOf("\n");
    while(newline>=0) {
      const event=JSON.parse(buffer.slice(0,newline)); buffer=buffer.slice(newline+1);
      if(event.error) {await reader.cancel(); throw new Error(event.error);}
      if(event.done) complete=true;
      newline=buffer.indexOf("\n");
    }
    if(done) break;
  }
  if(!complete) throw new Error("Procesarea s-a întrerupt. Mesajul rămâne în Inbox.");
  } catch (error) {
    if (!signal.aborted) await ensureExtractionReply({ data: { ids } });
    throw error;
  }
}