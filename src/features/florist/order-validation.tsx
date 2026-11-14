import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useFlorist } from "./store";
import type { Order, OrderStatus } from "./data";
import { normalizeText } from "@/lib/normalize-text";

export function OrderValidation({ order, onUpdated }: { order: Order; onUpdated: (status: OrderStatus, version: number) => void }) {
  const { validateOrder, rejectOrder } = useFlorist();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function validate() {
    setBusy(true);
    try {
      if (await validateOrder(order)) {
        onUpdated("Confirmată", (order.version ?? 1) + 1);
        toast.success("Comanda a fost validată, iar clientul a primit confirmarea.");
      }
    } finally { setBusy(false); }
  }
  async function reject() {
    if (!normalizeText(reason)) return;
    setBusy(true);
    try {
      if (await rejectOrder(order, reason)) {
        onUpdated("Respinsă", (order.version ?? 1) + 1);
        setRejectOpen(false);
        setReason("");
        toast.success("Comanda a fost respinsă, iar clientul a primit motivul.");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="validation-actions" role="group" aria-label="Validarea comenzii">
      <strong>Comanda așteaptă decizia florarului.</strong>
      <div>
        <Button disabled={busy} onClick={validate}><Check />Validează</Button>
        <Button variant="outline" disabled={busy} onClick={() => setRejectOpen(true)}><X />Respinge</Button>
      </div>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogTitle>Respinge comanda</DialogTitle>
          <DialogDescription>Motivul va fi trimis automat clientului în conversația WhatsApp.</DialogDescription>
          <label className="field">Motivul respingerii<textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. Florile solicitate nu mai sunt disponibile." /></label>
          <Button variant="destructive" disabled={busy || !normalizeText(reason)} onClick={reject}>Respinge și anunță clientul</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
