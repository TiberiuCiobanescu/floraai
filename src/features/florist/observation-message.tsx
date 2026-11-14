import { useState } from "react";
import { MessageCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderObservation } from "./order-observations";

export function ObservationMessage({ observation, onSend }: { observation: OrderObservation; onSend: (message: string) => void }) {
  const [edited, setEdited] = useState<string>();
  const label = observation.kind === "deadline" ? "Mesaj despre termenul de modificare" : `Mesaj despre stoc · ${observation.title.split(": ").slice(1).join(": ")}`;
  return (
    <div className="question-box">
      <h3>{label}</h3>
      <textarea aria-label={label} rows={6} value={edited ?? observation.template} onChange={(event) => setEdited(event.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onSend(edited ?? observation.template)}>
          <MessageCircle /> Trimite pe WhatsApp
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Resetează ${label}`} title="Reîncarcă modelul personalizat" onClick={() => setEdited(undefined)}>
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
}