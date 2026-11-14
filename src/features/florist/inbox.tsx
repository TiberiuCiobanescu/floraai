import { forwardRef, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
import { isOverdue, type Order } from "./data";
import { PageHeading, StatusBadge, Channel, AlertBand } from "./shared";
import { normalizeText, textEquals, textIncludes } from "@/lib/normalize-text";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCount, useEntrance } from "./motion";
import { toast } from "sonner";
import { newestMessagesFirst } from "./message-order";
const MessageLink = forwardRef<HTMLAnchorElement, { orderId: string; className: string; children: ReactNode }>(
  ({ orderId, ...props }, ref) => <Link ref={ref} to="/comenzi/$id" params={{ id: orderId }} {...props} />,
);
const MotionLink = motion.create(MessageLink);
export function InboxPage() {
  const entrance = useEntrance();
  const reduced = useReducedMotion();
  const { messages } = useFlorist();
  const [tab, setTab] = useState("Toate mesajele");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("Toate canalele");
  const [messageType, setMessageType] = useState("Toate tipurile");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState<"Fizic" | "Telefon">("Fizic");
  const navigate = useNavigate();
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
  function create() {
    if (!normalizeText(text)) return;
    toast.error("Crearea comenzilor din mesaje nu este încă conectată. Nu s-a adăugat o comandă fictivă.");
  }
  return (
    <>
      <PageHeading
        eyebrow="FIECARE CONVERSAȚIE CONTEAZĂ"
        title="Inbox"
        description="Toate mesajele clienților, într-un singur loc."
        actions={
          <>
            <Button variant="outline" onClick={() => {}}>
              <Upload />
              Încarcă chat WhatsApp (.txt)
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus />
              Comandă fizică / telefon
            </Button>
          </>
        }
      />
      <div className="stat-grid">
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
                {["Toate tipurile", "Comandă nouă", "Modificare", "Întrebare de preț", "Altceva", "Completare", "Confirmare"].map((type) => (
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
            <MotionLink
              orderId={m.orderId}
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
              <ChevronRight size={18} className="row-chevron" />
            </MotionLink>
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
          <Button disabled={!normalizeText(text)} onClick={create}>
            <Plus />
            Adaugă comanda
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
function FlowerNote() {
  return <span className="tiny-flower">✳</span>;
}
