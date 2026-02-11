"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { toast } from "sonner";
import { trackActivity } from "@/lib/gamification-client";
import type { Course } from "@/types/database";

const COURSE_COLORS = [
  { name: "Blau", value: "#3b82f6" },
  { name: "Grün", value: "#22c55e" },
  { name: "Rot", value: "#ef4444" },
  { name: "Gelb", value: "#eab308" },
  { name: "Lila", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Türkis", value: "#06b6d4" },
];

interface CourseFormDialogProps {
  course?: Course;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function CourseFormDialog({
  course,
  open: controlledOpen,
  onOpenChange,
  children,
}: CourseFormDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled
    ? (onOpenChange ?? (() => {}))
    : setUncontrolledOpen;

  const [name, setName] = useState(course?.name ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [color, setColor] = useState(
    course?.color ?? COURSE_COLORS[0].value
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isEditing = !!course;

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (newOpen) {
      setName(course?.name ?? "");
      setDescription(course?.description ?? "");
      setColor(course?.color ?? COURSE_COLORS[0].value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    if (isEditing) {
      const { error } = await supabase
        .from("courses")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          color,
        })
        .eq("id", course.id);

      if (error) {
        toast.error("Fehler beim Aktualisieren", {
          description: error.message,
        });
        setLoading(false);
        return;
      }
      toast.success("Kurs aktualisiert");
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nicht angemeldet");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("courses").insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        color,
      });

      if (error) {
        toast.error("Fehler beim Erstellen", { description: error.message });
        setLoading(false);
        return;
      }
      toast.success("Kurs erstellt");
      trackActivity("course_create");
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Kurs bearbeiten" : "Neuer Kurs"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Bearbeite die Details deines Kurses."
                : "Erstelle einen neuen Kurs, um deine Lernmaterialien zu organisieren."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course-name">Name *</Label>
              <Input
                id="course-name"
                placeholder="z.B. Lineare Algebra WS25"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-description">Beschreibung</Label>
              <Textarea
                id="course-description"
                placeholder="Worum geht es in diesem Kurs?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex gap-2 flex-wrap">
                {COURSE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      color === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading
                ? "Wird gespeichert..."
                : isEditing
                  ? "Speichern"
                  : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
