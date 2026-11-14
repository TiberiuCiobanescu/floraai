import { useState } from "react";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useFlorist } from "./store";
import { normalizeText } from "@/lib/normalize-text";

export function ClientNameEditor({ phone, name, disabled = false, onSaved }: {
  phone: string; name: string; disabled?: boolean; onSaved?: (name: string) => void;
}) {
  const { updateClientName } = useFlorist();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  async function save() {
    if (busy || !normalizeText(value)) return;
    setBusy(true);
    try {
      if (await updateClientName(phone, value)) {
        onSaved?.(value);
        setOpen(false);
        toast.success("Numele clientului a fost salvat.");
      }
    } finally { setBusy(false); }
  }
  return <>
    <Button variant="ghost" size="icon" aria-label="Editează numele clientului" title="Editează numele clientului" disabled={disabled} onClick={() => { setValue(name); setOpen(true); }}>
      <Pencil size={16} />
    </Button>
    <Dialog open={open} onOpenChange={next => { if (!busy) setOpen(next); }}>
      <DialogContent>
        <DialogTitle>Editează numele clientului</DialogTitle>
        <DialogDescription>{phone}</DialogDescription>
        <form className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); void save(); }}>
          <label className="field">Numele clientului<input value={value} maxLength={200} disabled={busy} onChange={event => setValue(event.target.value)} /></label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" disabled={busy} onClick={() => setOpen(false)}>Anulează</Button>
            <Button type="submit" disabled={busy || !normalizeText(value)}><Save />Salvează</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}