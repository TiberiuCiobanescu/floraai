import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { prepareExtraction } from "./extraction.functions";
import { processExtraction } from "./extraction-client";
import { validPhone, whatsappUrl } from "./whatsapp";
import { Link } from "@tanstack/react-router";
import {
  Upload,
  Plus,
  Search,
  ArrowUpRight,
  Inbox,
  Clock3,
  CircleCheck,
  MessageCircle,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useFlorist } from "./store";
import { isOverdue } from "./data";
import { PageHeading, StatusBadge, Channel, AlertBand } from "./shared";
import { normalizeText, textEquals, textIncludes } from "@/lib/normalize-text";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCount, useEntrance } from "./motion";
import { toast } from "sonner";
import { newestMessagesFirst } from "./message-order";
export function InboxPage() {
  const entrance = useEntrance();
  const reduced = useReducedMotion();
  const { messages: allMessages, orders, refresh } = useFlorist();
  const messages = allMessages.filter((message) => message.direction === "client");
  const awaitingValidation = orders.filter((order) => textEquals(order.status, "De validat")).length;
  const prepare = useServerFn(prepareExtraction);
  const fileInput = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [processingError, setProcessingError] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [tab, setTab] = useState("Toate mesajele");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("Toate canalele");
  const [messageType, setMessageType] = useState("Toate tipurile");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState<"Fizic" | "Telefon">("Fizic");
  const fresh = messages.filter((m) => textEquals(m.status, "Nou")).length;
  const waiting = messages.filter((m) => textEquals(m.status, "Așteaptă clientul")).length;
  const overdue = messages.filter(isOverdue).length;
  const filtered = useMemo(
    () =>
      newestMessagesFirst(messages.filter(
        (m) =>
          (textEquals(tab, "Toate mesajele") || textEquals(m.status, tab)) &&
          (textEquals(channel, "Toate canalele") || textEquals(m.channel, channel)) &&
          (textEquals(messageType, "Toate tipurile") || textEquals(m.type, messageType)) &&
          textIncludes(`${m.client} ${m.text}`, search),
      )),
    [messages, tab, channel, messageType, search],
  );
  async function process(textValue: string, channelValue: "WhatsApp" | "Fizic" | "Telefon") {
    if (busy) return;
    setBusy(true);
    setProcessingError("");
    const controller = new AbortController(); abort.current = controller;
    try {
      const prepared = await prepare({ data: { text: textValue, channel: channelValue, phone } });
      await refresh();
      for (const [index, ids] of prepared.groups.entries()) {
        if (controller.signal.aborted) break;
        setProgress(`Procesare ${index + 1} din ${prepared.groups.length}…`);
        await processExtraction(ids, controller.signal);
        await refresh();
      }
      if (!controller.signal.aborted) {
        toast.success(prepared.groups.length ? "Mesajele au fost procesate." : "Mesajele au fost deja importate.");
        if (channelValue !== "WhatsApp") { setOpen(false); setText(""); setPhone(""); }
      }
    } catch (error) {
      if (!controller.signal.aborted) {const message = error instanceof Error ? error.message : "Mesajele nu au fost procesate.";setProcessingError(message);toast.error(message);}
    } finally { await refresh(); setBusy(false); setProgress(""); abort.current = null; }
  }
  const activeMessage = messages.find(m => m.id === selectedMessage);
  return (
    <>
      <PageHeading
        eyebrow="FIECARE CONVERSAȚIE CONTEAZĂ"
        title="Inbox"
        description="Toate mesajele clienților, într-un singur loc."
        actions={
          <>
            <input ref={fileInput} type="file" accept=".txt,text/plain" className="hidden" aria-label="Fișier chat WhatsApp" onChange={async e => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > 2000000) { toast.error("Fișierul este prea mare. Încarcă o conversație mai scurtă."); return; }
              await process(await file.text(), "WhatsApp");
            }} />
            <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>
              <Upload />
              Încarcă chat WhatsApp (.txt)
            </Button>
            <Button disabled={busy} onClick={() => setOpen(true)}>
              <Plus />
              Comandă fizică / telefon
            </Button>
          </>
        }
      />
      {busy && <div className="action-notice" role="status">{progress || "Se salvează mesajele…"} <Button variant="ghost" onClick={() => abort.current?.abort()}>Oprește</Button></div>}
      {processingError && <div className="action-notice" role="alert">{processingError}</div>}
      <div className="stat-grid inbox-stat-grid">
        {[
          {
            label: "Mesaje noi",
            value: fresh,
            icon: Inbox,
            tone: "rose",
            caption: "Așteaptă răspunsul tău",
          },
          {
            label: "Așteaptă clientul",
            value: waiting,
            icon: Clock3,
            tone: "amber",
            caption: "Mai avem câteva detalii de clarificat",
          },
          {
            label: "Confirmate",
            value: messages.filter((m) => textEquals(m.status, "Confirmat")).length,
            icon: CircleCheck,
            tone: "green",
            caption: "Gata pentru următorul pas",
          },
          {
            label: "De validat",
            value: awaitingValidation,
            icon: Clock3,
            tone: "amber",
            caption: "Comenzi care așteaptă decizia ta",
          },
        ].map((s, i) => (
          <motion.div className="stat-card" key={s.label} {...entrance}
            transition={{ ...entrance.transition, delay: reduced ? 0 : i * 0.05 }}
            whileHover={reduced ? {} : { y: -2 }}>
            <div>
              <span className="stat-label">{s.label}</span>
              <AnimatedCount value={s.value} />
              <small>{s.caption}</small>
            </div>
            <span className={`stat-icon ${s.tone}`}>
              <s.icon size={21} />
            </span>
          </motion.div>
        ))}
      </div>
      {overdue > 0 && (
        <AlertBand>
          <strong>{overdue} mesaje fără răspuns de peste 2 ore</strong>
          <span className="alert-extra">Un răspuns la timp face diferența.</span>
          <Button variant="link" onClick={() => setTab("Nou")}>
            Vezi mesajele
            <ArrowUpRight />
          </Button>
        </AlertBand>
      )}
      <section className="inbox-section">
        <div className="section-title">
          <h2>
            Mesajele tale <span>{messages.length}</span>
          </h2>
          <span className="subtle-label">Astăzi, 14 noiembrie</span>
        </div>
        <div className="inbox-controls">
          <div className="tab-list">
            {["Toate mesajele", "Nou", "Așteaptă clientul", "Confirmat"].map((t) => (
              <Button
                variant="ghost"
                key={t}
                className={`tab-button ${textEquals(tab, t) ? "selected" : ""}`}
                onClick={() => setTab(t)}
              >
                {textEquals(t, "Nou") ? "Noi" : textEquals(t, "Confirmat") ? "Confirmate" : t}
                {textEquals(t, "Nou") && <span>{fresh}</span>}
              </Button>
            ))}
          </div>
          <div className="search-controls">
            <label className="search-field">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Caută un client sau un mesaj…"
                aria-label="Caută mesaje"
              />
            </label>
            <label className="filter-select">
              <SlidersHorizontal size={15} />
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                aria-label="Canalul mesajelor"
              >
                <option>Toate canalele</option>
                <option>WhatsApp</option>
                <option>Telefon</option>
                <option>Fizic</option>
              </select>
            </label>
            <label className="filter-select">
              <SlidersHorizontal size={15} />
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                aria-label="Tipul mesajelor"
              >
                {["Toate tipurile", "Comandă nouă", "Modificare", "Întrebare de preț", "Recomandare", "Altceva", "Completare", "Confirmare"].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="message-list">
          <div className="message-list-head">
            <span>CLIENT / MESAJ</span>
            <span>TIP MESAJ</span>
            <span>STATUS</span>
            <span />
          </div>
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              {...entrance}
              transition={{ ...entrance.transition, delay: reduced ? 0 : Math.min(i, 8) * 0.05 }}
              className={`message-row ${textEquals(m.status, "Nou") ? "unread" : ""}`}
            >
              <div className="message-main">
                <span className={`client-avatar avatar-${i % 4}`}>
                  {m.client
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="message-copy">
                  <div className="message-client">
                    <strong>{m.client}</strong>
                    <span>{m.time}</span>
                    {textEquals(m.status, "Nou") && <i />}
                  </div>
                  <p>{m.text}</p>
                  <Channel value={m.channel} />
                </div>
              </div>
              <div>
                <StatusBadge value={m.type} />
              </div>
              <div>
                <StatusBadge value={m.status} />
              </div>
              {m.orderId ? <Button variant="ghost" size="icon" asChild aria-label={`Deschide comanda ${m.orderId}`}><Link to="/comenzi/$id" params={{id:m.orderId}}><ChevronRight size={18} /></Link></Button> : <Button variant="ghost" size="icon" aria-label={`Deschide mesajul ${m.id}`} onClick={() => {setSelectedMessage(m.id);setReply(m.question ?? "");}}><ChevronRight size={18}/></Button>}
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <MessageCircle />
              <h3>Niciun mesaj găsit</h3>
              <p>Încearcă un alt nume sau un alt filtru.</p>
            </div>
          )}
        </div>
        <div className="list-footer">
          <span>
            {filtered.length} din {messages.length} mesaje
          </span>
          <span>
            <span className="online-dot" />
            Toate conversațiile sunt la zi
          </span>
        </div>
      </section>
      <div className="inbox-bottom-note">
        <FlowerNote />O comandă frumoasă începe cu o conversație bună.
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Comandă fizică / telefon</DialogTitle>
          <DialogDescription>Notează mesajul clientului.</DialogDescription>
          <label className="field">
            Telefonul clientului
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07… sau +40…" />
          </label>
          <label className="field">
            Canal
            <select
              value={source}
              onChange={(e) =>
                setSource(textEquals(e.target.value, "Telefon") ? "Telefon" : "Fizic")
              }
            >
              <option>Fizic</option>
              <option>Telefon</option>
            </select>
          </label>
          <label className="field">
            Comanda clientului
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex. Un buchet de 15 trandafiri roșii, pentru mâine…"
            />
          </label>
          <Button disabled={busy || !normalizeText(text) || !validPhone(phone)} onClick={() => process(text, source)}>
            <Plus />
            Adaugă comanda
          </Button>
          {processingError && <p className="text-destructive" role="alert">{processingError}</p>}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(activeMessage)} onOpenChange={value => {if (!value) setSelectedMessage(null);}}>
        <DialogContent>
          <DialogTitle>{activeMessage?.client}</DialogTitle>
          <DialogDescription>{activeMessage?.text}</DialogDescription>
          <label className="field">Mesaj pentru client<textarea value={reply} rows={4} onChange={e => setReply(e.target.value)} /></label>
          <Button variant="outline" disabled={!normalizeText(reply)} onClick={() => {
            if (!activeMessage) return;
            window.open(whatsappUrl(activeMessage.phone,reply),"_blank","noopener,noreferrer");
          }}><MessageCircle/>Deschide WhatsApp</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
function FlowerNote() {
  return <span className="tiny-flower">✳</span>;
}
