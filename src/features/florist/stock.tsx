import { Sprout, Truck, CalendarDays } from "lucide-react";
import { PageHeading, AlertBand, StatusBadge } from "./shared";
import { useFlorist } from "./store";
import { isLowStock, dateLabel } from "./data";
import { textEquals } from "@/lib/normalize-text";
import { motion, useReducedMotion } from "framer-motion";
import { useEntrance } from "./motion";
import { flowerLabel } from "./database-mapping";
export function StockPage() {
  const entrance = useEntrance();
  const reduced = useReducedMotion();
  const { stock, deliveries } = useFlorist();
  const low = stock.filter(isLowStock);
  return (
    <>
      <PageHeading
        eyebrow="GRIJĂ PENTRU FIECARE FIR"
        title="Stoc"
        description="Florile din atelier și livrările pe care le aștepți."
      />
      {low.map((s, i) => (
        <AlertBand key={s.name} index={i}>
          <strong>
            Au rămas {s.quantity} de{" "}
            {textEquals(s.name, "Trandafir roșu") ? "trandafiri roșii" : s.name.toLowerCase()}{" "}
            (pragul e {s.threshold})
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
            {stock.map((s, i) => (
              <motion.tr key={s.name} className={isLowStock(s) ? "low-stock-row" : ""}
                {...entrance} transition={{ ...entrance.transition, delay: reduced ? 0 : i * 0.05 }}>
                <td>
                  <span className="flower-name">
                    <Sprout size={18} />
                    <strong>{s.name}</strong>
                  </span>
                </td>
                <td>
                  <strong>{s.quantity}</strong> fire
                  <div className={`stock-level ${isLowStock(s) ? "below-threshold" : "above-threshold"}`} aria-hidden="true">
                    <motion.div className="stock-level-fill"
                      initial={reduced ? false : { scaleX: 0 }}
                      animate={{ scaleX: s.threshold <= 0 ? 1 : Math.min(1, s.quantity / s.threshold) }}
                      transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : i * 0.05 }} />
                  </div>
                </td>
                <td>{s.threshold} fire</td>
                <td>
                  <StatusBadge value={isLowStock(s) ? "Stoc redus" : "În regulă"} />
                </td>
              </motion.tr>
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
          {deliveries.map((s, i) => (
            <motion.article className="delivery-card" key={s.id} {...entrance}
              transition={{ ...entrance.transition, delay: reduced ? 0 : i * 0.05 }}
              whileHover={reduced ? {} : { y: -2 }}>
              <div className="delivery-heading">
                <span className="supplier-icon">
                  <Truck size={20} />
                </span>
                <h3>{s.furnizor}</h3>
                <StatusBadge value="În așteptare" />
              </div>
              <p>
                <CalendarDays size={15} />
                {dateLabel(s.data)}
              </p>
              <div className="delivery-flowers">{s.cantitate_fire} {flowerLabel(s.floare)}</div>

            </motion.article>
          ))}
        </div>
      </section>
    </>
  );
}
