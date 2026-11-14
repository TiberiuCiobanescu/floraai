import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useFlorist } from "./store";

export function ProfileEditor() {
  const { profile, setProfile } = useFlorist();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  return <Dialog open={open} onOpenChange={(next) => { if (next) setDraft(profile); setOpen(next); }}>
    <DialogTrigger asChild><Button variant="ghost" className="profile" aria-label="Editează profilul" title="Editează profilul">
      <span className="profile-avatar">{profile.initials}</span>
      <span className="profile-copy"><strong>{profile.name}</strong><small>{profile.description}</small></span>
      <span className="online-dot" />
    </Button></DialogTrigger>
    <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
      <DialogTitle>Profilul meu</DialogTitle>
      <DialogDescription>Datele afișate în profil.</DialogDescription>
      <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); if (!draft.name.trim()) return; setProfile(draft); setOpen(false); toast.success("Profil salvat"); }}>
        <label className="grid gap-2 text-sm">Nume<Input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label className="grid gap-2 text-sm">Descriere<Input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <label className="grid gap-2 text-sm">Inițiale<Input maxLength={3} value={draft.initials} onChange={(event) => setDraft({ ...draft, initials: event.target.value })} /></label>
        <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Anulează</Button><Button type="submit" disabled={!draft.name.trim()}><Save />Salvează</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}