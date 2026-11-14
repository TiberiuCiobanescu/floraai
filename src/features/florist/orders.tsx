import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Search, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, StatusBadge } from "./shared";
import { useFlorist } from "./store";
import { dateLabel, productSummary, modificationDeadline, canMarkExecuted, DEMO_NOW } from "./data";
export function OrdersPage() {
  const { orders, updateOrder, limits } = useFlorist();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Toate statusurile");
  const filtered = orders
    .filter(
      (o) =>
        o.client.toLowerCase().includes(search.toLowerCase()) &&
        (status === "Toate statusurile" || o.status === status),
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <>
      <PageHeading
        eyebrow="DE LA MESAJ LA BUCHET"
        title="Comenzi"
        description="Fiecare buchet, fiecare detaliu, la timpul potrivit."
      />
      <div className="section-title">
        <h2>
          Toate comenzile <span>{orders.length}</span>
        </h2>
        <div className="search-controls">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Caută comenzi"
              placeholder="Caută un client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            className="standalone-select"
            aria-label="Status comenzi"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "Toate statusurile",
              "Draft",
              "Așteaptă clientul",
              "Confirmată",
              "În lucru",
              "Executată",
              "Livrată",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {["LIVRARE", "CLIENT / PRODUSE", "TIP", "STATUS", "TERMEN MODIFICĂRI", ""].map(
                (h, i) => (
                  <th key={i}>{h}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const deadline = modificationDeadline(o, limits);
              return (
                <tr key={o.id}>
                  <td>
                    <strong>{dateLabel(o.date)}</strong>
                    <small>{o.time}</small>
                  </td>
                  <td>
                    <Link to="/comenzi/$id" params={{ id: o.id }} className="order-client">
                      {o.client}
                      <ArrowUpRight size={14} />
                    </Link>
                    <small>{productSummary(o)}</small>
                  </td>
                  <td>{o.type}</td>
                  <td>
                    <StatusBadge value={o.status} />
                  </td>
                  <td className={deadline < DEMO_NOW ? "expired-text" : ""}>
                    {dateLabel(deadline.toISOString().slice(0, 10))}
                    <small>
                      {deadline.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                      {deadline < DEMO_NOW ? " · Expirat" : ""}
                    </small>
                  </td>
                  <td>
                    {canMarkExecuted(o.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrder({ ...o, status: "Executată" })}
                      >
                        <Check />
                        Marchează executată
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">Nicio comandă găsită.</div>}
      </div>
      <div className="list-footer">
        <span>{filtered.length} comenzi</span>
        <span>În ordinea livrării</span>
      </div>
    </>
  );
}
