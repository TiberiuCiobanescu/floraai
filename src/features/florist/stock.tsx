import { Sprout, Truck, CalendarDays } from "lucide-react";
import { PageHeading, AlertBand, StatusBadge } from "./shared";
import { useFlorist } from "./store";
import { isLowStock } from "./data";
export function StockPage() {
  const { stock } = useFlorist();
  const low = stock.filter(isLowStock);
  return (
    <>
      <PageHeading
        eyebrow="GRIJĂ PENTRU FIECARE FIR"
        title="Stoc"
        description="Florile din atelier și livrările pe care le aștepți."
      />
      {low.map((s) => (
        <AlertBand key={s.name}>
          <strong>
            Au rămas {s.quantity} de{" "}
            {s.name === "Trandafir roșu" ? "trandafiri roșii" : s.name.toLowerCase()} (pragul e{" "}
            {s.threshold})
          </strong>
          <span className="alert-extra">Stoc redus</span>
        </AlertBand>
      ))}
      <div className="section-title">
        <h2>
          Florile din atelier <span>{stock.length}</span>
        </h2>
        <span className="subtle-label">Cantități în fire</span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>FLOARE</th>
              <th>CANTITATE (FIRE)</th>
              <th>PRAG DE ALERTĂ</th>
              <th>STARE</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.name} className={isLowStock(s) ? "low-stock-row" : ""}>
                <td>
                  <span className="flower-name">
                    <Sprout size={18} />
                    <strong>{s.name}</strong>
                  </span>
                </td>
                <td>
                  <strong>{s.quantity}</strong> fire
                </td>
                <td>{s.threshold} fire</td>
                <td>
                  <StatusBadge value={isLowStock(s) ? "Stoc redus" : "În regulă"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="supplier-section">
        <div className="section-title">
          <h2>Livrări așteptate de la furnizor</h2>
          <Truck size={20} />
        </div>
        <div className="delivery-grid">
          {[
            {
              name: "Flora Holland",
              date: "16 nov. · 08:00–10:00",
              flowers: "100 trandafiri roșii · 60 frezii · 40 crini",
              waiting: 3,
            },
            {
              name: "Grădina de lângă noi",
              date: "17 nov. · 09:00–12:00",
              flowers: "50 trandafiri albi · 30 eucalipt · 40 lisianthus",
              waiting: 2,
            },
          ].map((s) => (
            <article className="delivery-card" key={s.name}>
              <div className="delivery-heading">
                <span className="supplier-icon">
                  <Truck size={20} />
                </span>
                <h3>{s.name}</h3>
                <StatusBadge value="În așteptare" />
              </div>
              <p>
                <CalendarDays size={15} />
                {s.date}
              </p>
              <div className="delivery-flowers">{s.flowers}</div>
              <small>
                <span className="online-dot" />
                {s.waiting} comenzi așteaptă această livrare
              </small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
