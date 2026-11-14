import { useState } from "react";
import { ChevronDown, Flower2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFlorist } from "./store";

export function WorkspaceEditor() {
  const { workspace, setWorkspace } = useFlorist();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(workspace);
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" className="workspace" aria-label="Opțiuni florărie">
        <span className="workspace-icon"><Flower2 size={19} /></span>
        <span className="workspace-copy"><strong>{workspace.name}</strong><small>{workspace.location}</small></span>
        <ChevronDown size={15} />
      </Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start"><DropdownMenuItem onSelect={() => { setDraft(workspace); setOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Editează florăria</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogTitle>Editează florăria</DialogTitle>
        <DialogDescription>Datele florăriei tale.</DialogDescription>
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); if (!draft.name.trim() || !draft.location.trim()) return; setWorkspace(draft); setOpen(false); toast.success("Datele florăriei au fost salvate"); }}>
          <label className="grid gap-2 text-sm">Numele florăriei<Input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label className="grid gap-2 text-sm">Localitate<Input required value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label>
          <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Anulează</Button><Button type="submit" disabled={!draft.name.trim() || !draft.location.trim()}><Save />Salvează</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}