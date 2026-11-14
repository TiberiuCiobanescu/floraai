import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeading } from "./shared";
import { ConversationBubbles } from "./conversation";
import { useFlorist } from "./store";
import { sendSimulatorMessage } from "./extraction.functions";
import { processExtraction } from "./extraction-client";
import { phoneKey, validPhone } from "./whatsapp";
import { normalizeText } from "@/lib/normalize-text";

export function SimulatorPage() {
  const { clients, messages, refresh } = useFlorist();
  const sendMessage = useServerFn(sendSimulatorMessage);
  const [selection, setSelection] = useState("new");
  const [newPhone, setNewPhone] = useState("+40");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const conversationEnd = useRef<HTMLDivElement>(null);
  const selectedClient = clients.find((client) => client.phone === selection);
  const phone = selectedClient?.phone ?? newPhone;
  const conversation = useMemo(
    () => messages.filter((message) => validPhone(message.phone) && validPhone(phone) && phoneKey(message.phone) === phoneKey(phone)),
    [messages, phone],
  );

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [conversation.length]);

  async function submit() {
    if (busy || !normalizeText(text) || !validPhone(phone)) return;
    setBusy(true);
    setProgress("Se salvează mesajul…");
    try {
      const saved = await sendMessage({ data: { phone, text } });
      setText("");
      await refresh();
      setProgress("FloraAI pregătește răspunsul…");
      await processExtraction([saved.id], new AbortController().signal);
      await refresh();
      toast.success("Mesajul a fost procesat.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mesajul nu a putut fi procesat.";
      toast.error(message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CONVERSAȚII ÎN TIMP REAL"
        title="Simulator WhatsApp"
        description="Trimite mesaje ca client și vezi exact cum răspunde FloraAI."
      />
      <section className="simulator-layout" aria-label="Simulator de conversație WhatsApp">
        <div className="simulator-client-panel">
          <span className="simulator-panel-icon"><Smartphone /></span>
          <h2>Alege clientul</h2>
          <p>Folosește un client existent sau un număr nou.</p>
          <label className="field">
            Client
            <select value={selection} onChange={(event) => setSelection(event.target.value)} disabled={busy}>
              <option value="new">Client nou</option>
              {clients.map((client) => <option key={client.phone} value={client.phone}>{client.name} · {client.phone}</option>)}
            </select>
          </label>
          {selection === "new" && (
            <label className="field">
              Telefon client nou
              <input type="tel" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} placeholder="+407…" disabled={busy} />
            </label>
          )}
          <div className="simulator-note">
            <MessageCircle size={17} />
            <span>Mesajele și răspunsurile se salvează în conversația reală.</span>
          </div>
        </div>
        <div className="whatsapp-phone">
          <header className="whatsapp-header">
            <span className="client-avatar avatar-1">{(selectedClient?.name ?? "CN").split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
            <div><strong>{selectedClient?.name ?? "Client nou"}</strong><small>{phone}</small></div>
            <span className="online-dot" />
          </header>
          <div className="whatsapp-conversation">
            <ConversationBubbles messages={conversation} />
            <div ref={conversationEnd} />
          </div>
          {progress && <div className="simulator-progress" role="status">{progress}</div>}
          <form className="whatsapp-composer" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <textarea
              aria-label="Mesajul clientului"
              placeholder="Scrie un mesaj…"
              rows={1}
              value={text}
              disabled={busy}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            <Button type="submit" aria-label="Trimite mesajul" disabled={busy || !normalizeText(text) || !validPhone(phone)}>
              <Send />Trimite
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
