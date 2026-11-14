import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Send, Plus, Trash2, Save, History, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlorist } from "./store";
import { PageHeading, StatusBadge, Channel, AlertBand } from "./shared";
import { modificationDeadline, DEMO_NOW, dateLabel, deadlineDateKey, type Order } from "./data";
import { normalizeText, textEquals } from "@/lib/normalize-text";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { useEntrance } from "./motion";
import { clientQuestionOptions, recommendedClientQuestions } from "./client-questions";
import { orderObservations } from "./order-observations";
import { changeProductName } from "./order-safety";
import { whatsappUrl } from "./whatsapp";
import { editableMissingFields } from "./extraction-rules";
export function OrderDetail({ id }: { id: string }) {
  const entrance = useEntrance();
  const reduced = useReducedMotion();
  const { orders, messages, stock, limits, catalog, updateOrder, updateMessage } = useFlorist();
  const original = orders.find((o) => o.id === id);
  const [draft, setDraft] = useState<Order | undefined>(original);
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState(() =>
    original ? original.question || recommendedClientQuestions(original, messages)[0] || "" : "",
  );
  if (!draft)
    return (
      <>
        <Link to="/comenzi">Înapoi la comenzi</Link>
        <h1>Comanda nu a fost găsită</h1>
      </>
    );
  const order = draft;
  const settled = textEquals(order.status, "Executată") || textEquals(order.status, "Livrată");
  const observations = orderObservations(order, stock, limits, DEMO_NOW, messages);
  const recommendations = clientQuestionOptions(order, messages);
  const message = messages.find((m) => m.orderId === id);
  const deadline = modificationDeadline(order, limits);
  const expired = deadline < DEMO_NOW;
  const required = ["client", "phone", "address", "recipient"] as const;
  const missing = required.filter((k) => !normalizeText(order[k]));
  const missingProduct =
    order.products.length === 0 ||
    order.products.some((p) => !normalizeText(p.name) || p.quantity < 1);
  const extractedMissing = editableMissingFields(order);
  function change<K extends keyof Order>(key: K, value: Order[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setNotice("");
  }
  async function save(status = order.status) {
    if (settled) return false;
    const next = {
      ...order,
      status,
      question,
      versions: [
        ...order.versions,
        `v${order.versions.length + 1} · 14 nov., 10:05 · ${textEquals(status, "Confirmată") ? "Comandă confirmată" : "Detalii actualizate"}`,
      ],
    };
    if (!(await updateOrder(next))) return false;
    setDraft({ ...next, version: (order.version ?? 1) + 1, versions: [`v${(order.version ?? 1) + 1}`] });
    setNotice("Modificările au fost salvate.");
    return true;
  }
  async function confirm() {
    if (missing.length || missingProduct || extractedMissing.length) {
      setNotice("Completează câmpurile lipsă înainte de confirmare.");
      return;
    }
    if (!(await save("Confirmată"))) return;
    if (!(await updateMessage(id, "Confirmat"))) return;
    setNotice("Comanda a fost confirmată.");
    toast.success("Comanda a fost confirmată.");
  }
  async function sendQuestion(text: string) {
    if (!normalizeText(text) || /\[[^\]]+\]/.test(text)) {
      setNotice("Completează modelul de mesaj înainte de trimitere.");
      toast.error("Completează modelul de mesaj înainte de trimitere.");
      return;
    }
    if (order.warning && !window.confirm(`${order.warning}\n\nDeschizi WhatsApp pentru această comandă?`)) return;
    let url: string;
    try { url = whatsappUrl(order.phone,text); } catch(error) {toast.error(error instanceof Error ? error.message : "Telefon invalid.");return;}
    const popup = window.open("about:blank", "_blank");
    if (!popup) {toast.error("Permite deschiderea WhatsApp în browser înainte de a continua.");return;}
    popup.opener = null;
    if (!(await save("Așteaptă clientul"))) {popup.close();return;}
    if (!(await updateMessage(id, "Așteaptă clientul"))) {popup.close();return;}
    popup.location.href = url;
    setNotice("WhatsApp a fost deschis cu mesajul pregătit.");
    toast.success("WhatsApp a fost deschis cu mesajul pregătit.");
  }
  return (
    <>
      <Link to="/inbox" className="back-link">
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
            <Button variant="outline" disabled={settled} onClick={() => save()}>
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
                <small>{message ? `${dateLabel(message.received.slice(0, 10))} · ${message.time}` : "—"}</small>
              </div>
            </div>
            <blockquote>{message?.text ?? "Nu există un mesaj asociat acestei comenzi."}</blockquote>
            {message && <Channel value={message.channel} />}
          </motion.article>
          <div className="deadline-block">
            <h3>Termen de modificare</h3>
            {!Number.isFinite(deadline.getTime()) ? <p>Completează data livrării.</p> : expired ? (
              <AlertBand tone="amber">
                <div>
                  <strong>Termenul de modificare a trecut</strong>
                  <small>
                    {dateLabel(deadlineDateKey(deadline))} la{" "}
                    {deadline.toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" })}
                  </small>
                </div>
              </AlertBand>
            ) : (
              <p>
                Modificări posibile până{" "}
                {deadlineDateKey(deadline) === deadlineDateKey(DEMO_NOW)
                  ? "azi"
                  : dateLabel(deadlineDateKey(deadline))}{" "}
                la{" "}
                <strong>
                  {deadline.toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" })}
                </strong>
                .
              </p>
            )}
          </div>
          {order.warning && <AlertBand tone="amber"><strong>{order.warning}</strong></AlertBand>}
          {observations.length > 0 && (
            <section className="mb-6" aria-label="Observații comandă">
              <h3 className="mb-3">Observații</h3>
              {observations.map((observation) => (
                <AlertBand key={observation.title} tone="amber">
                  <div className="min-w-0">
                    <strong>{observation.title}</strong>
                    <p className="my-2 text-sm">{observation.detail}</p>
                  </div>
                </AlertBand>
              ))}
            </section>
          )}
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
          <fieldset disabled={settled} className="form-grid">
            {extractedMissing.length > 0 && <div className="field full-width missing-field" role="status">Detalii lipsă: {extractedMissing.map(f => ({data_livrare:"data livrării",adresa:"adresa",destinatar:"destinatarul",produse:"produsele",produs:"alegerea produsului"})[f] ?? f).join(", ")}</div>}
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
              <datalist id="catalog-produse">{catalog.map((product) => <option key={product.id} value={product.nume} />)}</datalist>
              {order.missingFields?.includes("produs") && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={false} onChange={() => change("missingFields", (order.missingFields ?? []).filter(f => f !== "produs"))} />Produsul ales a fost verificat cu clientul</label>}
              {order.products.map((p, i) => (
                <div className="product-input-row" key={i}>
                  <input
                    aria-label={`Produs ${i + 1}`}
                    placeholder="Nume produs"
                    list="catalog-produse"
                    value={p.name}
                    onChange={(e) =>
                      change(
                        "products",
                        order.products.map((v, j) =>
                          i === j ? changeProductName(v, e.target.value, catalog) : v,
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
          </fieldset>
          <div className="question-box">
            <h3>Întrebare pentru client</h3>
            <div className="mb-3 flex flex-col items-start gap-2" aria-label="Întrebări recomandate">
              <span className="text-xs text-muted-foreground">Întrebări recomandate</span>
              {observations.map((observation) => (
                <Button
                  key={observation.title}
                  variant="outline"
                  className="h-auto max-w-full justify-start whitespace-normal text-left text-xs"
                  onClick={() => setQuestion(observation.template)}
                >
                  <Plus className="shrink-0" />
                  {observation.kind === "deadline" ? (expired ? "Solicitare după termenul de modificare" : "Termen de modificare") : observation.title}
                </Button>
              ))}
              {recommendations.map((recommendation) => (
                <Button
                  key={recommendation.label}
                  variant="outline"
                  className="h-auto max-w-full justify-start whitespace-normal text-left text-xs"
                  onClick={() => setQuestion(recommendation.template)}
                >
                  <Plus className="shrink-0" />
                  {recommendation.label}
                </Button>
              ))}
            </div>
            <textarea
              aria-label="Întrebare pentru client"
              rows={2}
              disabled={settled}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button
              variant="outline"
              disabled={settled}
              onClick={() => sendQuestion(question)}
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
              disabled={settled}
              onClick={() => sendQuestion(question)}
            >
              <Send />
              Trimite rezumatul spre confirmare
            </Button>
            <Button disabled={settled || missing.length > 0 || missingProduct || extractedMissing.length > 0} onClick={confirm}>
              <Check />
              Marchează confirmată
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
