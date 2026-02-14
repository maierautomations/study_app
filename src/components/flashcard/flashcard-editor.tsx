"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface CreateFlashcardDialogProps {
  courseId: string;
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateFlashcardDialog({
  courseId,
  onCreated,
  trigger,
}: CreateFlashcardDialogProps) {
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState([{ front: "", back: "" }]);
  const [saving, setSaving] = useState(false);

  function addCard() {
    setCards((prev) => [...prev, { front: "", back: "" }]);
  }

  function removeCard(index: number) {
    if (cards.length <= 1) return;
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCard(index: number, field: "front" | "back", value: string) {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  async function handleSave() {
    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
      toast.error("Mindestens eine Karte mit Frage und Antwort erforderlich.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/flashcards/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, cards: validCards }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Fehler" }));
        toast.error(err.error || "Fehler beim Erstellen.");
        return;
      }

      toast.success(`${validCards.length} Flashcard(s) erstellt!`);
      setOpen(false);
      setCards([{ front: "", back: "" }]);
      onCreated?.();
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Eigene Flashcard erstellen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Eigene Flashcards erstellen</DialogTitle>
          <DialogDescription>
            Erstelle manuell Flashcards mit Frage und Antwort.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {cards.map((card, i) => (
            <div key={i} className="space-y-2 p-3 border rounded-lg relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Karte {i + 1}
                </span>
                {cards.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeCard(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-xs">Frage (Vorderseite)</Label>
                <Textarea
                  value={card.front}
                  onChange={(e) => updateCard(i, "front", e.target.value)}
                  placeholder="z.B. Was ist Machine Learning?"
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs">Antwort (Rückseite)</Label>
                <Textarea
                  value={card.back}
                  onChange={(e) => updateCard(i, "back", e.target.value)}
                  placeholder="z.B. Ein Teilgebiet der KI..."
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addCard} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Weitere Karte hinzufügen
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {cards.filter((c) => c.front.trim() && c.back.trim()).length} Karte(n) speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditFlashcardDialogProps {
  flashcardId: string;
  initialFront: string;
  initialBack: string;
  onSaved?: (front: string, back: string) => void;
}

export function EditFlashcardDialog({
  flashcardId,
  initialFront,
  initialBack,
  onSaved,
}: EditFlashcardDialogProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!front.trim() || !back.trim()) {
      toast.error("Frage und Antwort dürfen nicht leer sein.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/flashcards/manual", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId, front, back }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Fehler" }));
        toast.error(err.error || "Fehler beim Speichern.");
        return;
      }

      toast.success("Flashcard aktualisiert!");
      setOpen(false);
      onSaved?.(front, back);
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setFront(initialFront); setBack(initialBack); } }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Flashcard bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Frage (Vorderseite)</Label>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div>
            <Label className="text-xs">Antwort (Rückseite)</Label>
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
