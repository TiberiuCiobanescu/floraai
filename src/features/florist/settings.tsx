import { useState } from "react";
import { Save, Clock3, Sprout, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "./shared";
import { useFlorist } from "./store";
import { textEquals } from "@/lib/normalize-text";
import { toast } from "sonner";
export function SettingsPage() {
  const { stock, limits, saveSettings } = useFlorist();
  const [draftStock, setDraftStock] = useState(stock);
  const [draftLimits, setDraftLimits] = useState(limits);
  const [saved, setSaved] = useState(false);
  async function save() {
    try {
      await saveSettings(draftStock, draftLimits);
      setSaved(true);
      toast.success("Setări salvate");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Setările nu au fost salvate."); }
  }
  return (
    <>
      <PageHeading
        eyebrow="ATELIERUL TĂU, REGULILE TALE"
        title="Setări"
        description="Termene și praguri potrivite ritmului tău de lucru."
        actions={
          <Button onClick={save}>
            {saved ? <Check /> : <Save />}
            {saved ? "Setări salvate" : "Salvează modificările"}
          </Button>
        }
      />
      <section className="settings-section">
        <div className="settings-intro">
          <Clock3 size={22} />
          <h2>Termene de modificare</h2>
          <p>Înainte de ora de început a livrării.</p>
        </div>
        <div className="settings-fields">
          {(["Buchet în oraș", "Nuntă"] as const).map((type) => (
            <label className="settings-line" key={type}>
              <div>
                <strong>{type}</strong>
                <small>
                  {textEquals(type, "Nuntă")
                    ? "Aranjamente și evenimente"
                    : "Buchete cu livrare locală"}
                </small>
              </div>
              <div className="number-unit">
                <input
                  type="number"
                  min={0}
                  max={720}
                  aria-label={`Termen ${type}`}
                  value={draftLimits[type]}
                  onChange={(e) => {
                    setDraftLimits({ ...draftLimits, [type]: Math.max(0, Number(e.target.value)) });
                    setSaved(false);
                  }}
                />
                <span>ore înainte</span>
              </div>
            </label>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-intro">
          <Sprout size={22} />
          <h2>Praguri de stoc</h2>
          <p>O alertă apare când stocul scade sub prag.</p>
        </div>
        <div className="settings-fields">
          {draftStock.map((s, i) => (
            <label className="settings-line" key={s.name}>
              <strong>{s.name}</strong>
              <div className="number-unit">
                <input
                  type="number"
                  min={0}
                  aria-label={`Prag ${s.name}`}
                  value={s.threshold}
                  onChange={(e) => {
                    setDraftStock((prev) =>
                      prev.map((v, j) =>
                        j === i ? { ...v, threshold: Math.max(0, Number(e.target.value)) } : v,
                      ),
                    );
                    setSaved(false);
                  }}
                />
                <span>fire</span>
              </div>
            </label>
          ))}
        </div>
      </section>
    </>
  );
}
