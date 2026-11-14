import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlorist } from "./store";
import type { Order } from "./data";
import { textEquals } from "@/lib/normalize-text";

export function CancellationDecision({ order, onUpdated }: { order: Order; onUpdated: (order: Order) => void }) {
  const { resolveCancellation } = useFlorist();
  const [busy, setBusy] = useState(false);
  if (!textEquals(order.warning ?? "", "Anulare primita dupa termen")) return null;
  async function decide(accept: boolean) {
    setBusy(true);
    try {
      if (await resolveCancellation(order, accept)) onUpdated({ ...order, status: accept ? "Anulată" : order.status, warning: "", version: (order.version ?? 1) + 1 });
    } finally { setBusy(false); }
  }
  return <div className="validation-actions" role="group" aria-label="Decizia anulării">
    <strong>Anulare primită după termen</strong>
    <div>
      <Button disabled={busy} onClick={() => decide(true)}><Check />Acceptă anularea</Button>
      <Button variant="outline" disabled={busy} onClick={() => decide(false)}><X />Refuză</Button>
    </div>
  </div>;
}