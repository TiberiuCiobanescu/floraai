import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Send, Plus, Trash2, Save, History, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlorist } from "./store";
import { PageHeading, StatusBadge, Channel, AlertBand } from "./shared";
import { modificationDeadline, DEMO_NOW, dateLabel, type Order } from "./data";
import { normalizeText, textEquals } from "@/lib/normalize-text";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { useEntrance } from "./motion";
export function OrderDetail({ id }: { id: string }) {
  const entrance = useEntrance();
  const reduced = useReducedMotion();
  const { orders, messages, limits, updateOrder, updateMessage } = useFlorist();
  const original = orders.find((o) => o.id === id);
  const [draft, setDraft] = useState<Order | undefined>(original);
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState(
    "Ne puteți trimite adresa de livrare și numele destinatarului?",
  );
  if (!draft)
    return (
      <>
        <Link to="/comenzi">Înapoi la comenzi</Link>
        <h1>Comanda nu a fost găsită</h1>
      </>
    );
  const order = draft;
  const message = messages.find((m) => m.orderId === id);
  const deadline = modificationDeadline(order, limits);
  const expired = deadline < DEMO_NOW;
  const required = ["client", "phone", "address", "recipient"] as const;
  const missing = required.filter((k) => !normalizeText(order[k]));
  const missingProduct =
    order.products.length === 0 ||
    order.products.some((p) => !normalizeText(p.name) || p.quantity < 1);
  function change<K extends keyof Order>(key: K, value: Order[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setNotice("");
  }
  function save(status = order.status) {
    const next = {
      ...order,
      status,
      versions: [
        ...order.versions,
        `v${order.versions.length + 1} · 14 nov., 12:00 · ${textEquals(status, "Confirmată") ? "Comandă confirmată" : "Detalii actualizate"}`,
      ],
    };
    updateOrder(next);
    setDraft(next);
    setNotice("Modificările au fost salvate.");
  }
  function confirm() {
    if (missing.length || missingProduct) {
      setNotice("Completează câmpurile lipsă înainte de confirmare.");
      return;
    }
    save("Confirmată");
    updateMessage(id, "Confirmat");
    setNotice("Comanda a fost confirmată.");
    toast.success("Comanda a fost confirmată.");
  }
  return (
    <>
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Înapoi la Inbox
      </Link>
      <PageHeading
        eyebrow={`COMANDA #${id}`}
        title={order.client}
        description={`${dateLabel(order.date)} · ${order.time}`}
        actions={
          <>
            <StatusBadge value={order.status} />
            <Button variant="outline" onClick={() => save()}>
              <Save />
              Salvează
            </Button>
          </>
        }
      />
      <div className="detail-layout">
        <section className="original-message">
          <div className="section-title">
            <h2>Mesajul original</h2>
            <MessageCircle size={18} />
          </div>
          <motion.article className="original-card" {...entrance} whileHover={reduced ? {} : { y: -2 }}>
            <div className="original-client">
              <span className="client-avatar avatar-0">
                {(message?.client ?? order.client)
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <strong>{message?.client ?? order.client}</strong>
                <small>14 noiembrie · {message?.time ?? "12:00"}</small>
              </div>
            </div>
            <blockquote>{message?.text ?? "Comandă introdusă în atelier."}</blockquote>
            <Channel value={message?.channel ?? "Fizic"} />
          </motion.article>
          <div className="deadline-block">
            <h3>Termen de modificare</h3>
            {expired ? (
              <AlertBand tone="amber">
                <div>
                  <strong>Termenul de modificare a trecut</strong>
                  <small>
                    {dateLabel(deadline.toISOString().slice(0, 10))} la{" "}
                    {deadline.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                  </small>
                </div>
              </AlertBand>
            ) : (
              <p>
                Modificări posibile până{" "}
                {deadline.toDateString() === DEMO_NOW.toDateString()
                  ? "azi"
                  : dateLabel(deadline.toISOString().slice(0, 10))}{" "}
                la{" "}
                <strong>
                  {deadline.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                </strong>
                .
              </p>
            )}
          </div>
          <div className="version-history">
            <h3>
              <History size={17} />
              Istoricul versiunilor
            </h3>
            {order.versions.length ? (
              order.versions.map((v, i) => <p key={i}>{v}</p>)
            ) : (
              <p>v1 · Comandă inițială</p>
            )}
          </div>
        </section>
        <section className="order-form">
          <div className="section-title">
            <h2>Detaliile comenzii</h2>
            <span className="subtle-label">
              {missing.length + (missingProduct ? 1 : 0) > 0
                ? `${missing.length + (missingProduct ? 1 : 0)} detalii lipsă`
                : "Toate detaliile sunt completate"}
            </span>
          </div>
          <div className="form-grid">
            {(
              [
                { key: "client", label: "Client" },
                { key: "phone", label: "Telefon" },
              ] as const
            ).map((f) => (
              <label className={`field ${missing.includes(f.key) ? "missing-field" : ""}`} key={f.key}>
                {f.label}
                {missing.includes(f.key) && <span>lipsește</span>}
                <input value={order[f.key]} onChange={(e) => change(f.key, e.target.value)} />
              </label>
            ))}
            <label className="field full-width">
              Tip comandă
              <select
                value={order.type}
                onChange={(e) =>
                  change("type", textEquals(e.target.value, "Nuntă") ? "Nuntă" : "Buchet în oraș")
                }
              >
                <option>Buchet în oraș</option>
                <option>Nuntă</option>
              </select>
            </label>
            <div className={`field full-width ${missingProduct ? "missing-field" : ""}`}>
              Produse{missingProduct && <span className="text-destructive">lipsește</span>}
              {order.products.map((p, i) => (
                <div className="product-input-row" key={i}>
                  <input
                    aria-label={`Produs ${i + 1}`}
                    placeholder="Nume produs"
                    value={p.name}
                    onChange={(e) =>
                      change(
                        "products",
                        order.products.map((v, j) =>
                          i === j ? { ...v, name: e.target.value } : v,
                        ),
                      )
                    }
                  />
                  <input
                    type="number"
                    min={1}
                    aria-label={`Cantitate ${i + 1}`}
                    value={p.quantity}
                    onChange={(e) =>
                      change(
                        "products",
                        order.products.map((v, j) =>
                          i === j ? { ...v, quantity: Math.max(1, Number(e.target.value)) } : v,
                        ),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Șterge produs ${i + 1}`}
                    title="Șterge produs"
                    onClick={() =>
                      change(
                        "products",
                        order.products.filter((_, j) => i !== j),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                variant="link"
                className="add-product"
                onClick={() => change("products", [...order.products, { name: "", quantity: 1 }])}
              >
                <Plus />
                Adaugă produs
              </Button>
            </div>
            <label className="field full-width">
              Auxiliare
              <input value={order.extras} onChange={(e) => change("extras", e.target.value)} />
            </label>
            <label className="field">
              Data livrării
              <input
                type="date"
                value={order.date}
                onChange={(e) => {
                  if (e.target.value) change("date", e.target.value);
                }}
              />
            </label>
            <label className="field">
              Interval orar
              <select value={order.time} onChange={(e) => change("time", e.target.value)}>
                {Array.from(
                  new Set([
                    order.time,
                    "09:00–11:00",
                    "10:00–12:00",
                    "13:00–14:00",
                    "15:00–17:00",
                    "16:00–18:00",
                  ]),
                ).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            {(
              [
                { key: "address", label: "Adresă" },
                { key: "recipient", label: "Destinatar" },
              ] as const
            ).map((f) => (
              <label
                className={`field full-width ${missing.includes(f.key) ? "missing-field" : ""}`}
                key={f.key}
              >
                {f.label}
                {missing.includes(f.key) && <span>lipsește</span>}
                <input
                  placeholder={missing.includes(f.key) ? "Completează acest detaliu" : ""}
                  value={order[f.key]}
                  onChange={(e) => change(f.key, e.target.value)}
                />
              </label>
            ))}
            <label className="field full-width">
              Text bilețel <small>opțional</small>
              <textarea
                rows={2}
                value={order.note}
                onChange={(e) => change("note", e.target.value)}
              />
            </label>
          </div>
          <div className="question-box">
            <h3>Întrebare pentru client</h3>
            <textarea
              aria-label="Întrebare pentru client"
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => {
                save("Așteaptă clientul");
                updateMessage(id, "Așteaptă clientul");
                setNotice("Simulare: întrebarea a fost trimisă pe WhatsApp.");
                toast.success("Simulare: întrebarea a fost trimisă pe WhatsApp.");
              }}
            >
              <MessageCircle />
              Trimite pe WhatsApp
            </Button>
          </div>
          {notice && (
            <div className="action-notice" role="status">
              {notice}
            </div>
          )}
          <div className="detail-actions">
            <Button
              variant="outline"
              onClick={() => {
                save("Așteaptă clientul");
                updateMessage(id, "Așteaptă clientul");
                setNotice("Simulare: rezumatul a fost trimis spre confirmare.");
              }}
            >
              <Send />
              Trimite rezumatul spre confirmare
            </Button>
            <Button onClick={confirm}>
              <Check />
              Marchează confirmată
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
