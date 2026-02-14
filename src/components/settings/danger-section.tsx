"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function DangerSection() {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleExportData() {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profile },
        { data: courses },
        { data: documents },
        { data: quizzes },
        { data: flashcardSets },
        { data: achievements },
        { data: sessions },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("courses").select("*").eq("user_id", user.id),
        supabase.from("documents").select("*").eq("user_id", user.id),
        supabase.from("quizzes").select("*").eq("user_id", user.id),
        supabase.from("flashcard_sets").select("*").eq("user_id", user.id),
        supabase.from("user_achievements").select("*, achievements(*)").eq("user_id", user.id),
        supabase.from("study_sessions").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile,
        courses,
        documents,
        quizzes,
        flashcardSets,
        achievements,
        sessions,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `studyapp-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Daten exportiert");
    } catch {
      toast.error("Export fehlgeschlagen");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== "LÖSCHEN") return;

    setDeleting(true);
    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Löschen fehlgeschlagen");
      }

      await supabase.auth.signOut();
      toast.success("Konto gelöscht");
      router.push("/");
    } catch (err) {
      toast.error("Fehler beim Löschen", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Data export (DSGVO) */}
      <Card>
        <CardHeader>
          <CardTitle>Datenexport</CardTitle>
          <CardDescription>
            Lade alle deine Daten als JSON-Datei herunter (DSGVO Art. 20).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExportData} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Alle Daten exportieren
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
          <CardDescription>
            Lösche dein Konto und alle zugehörigen Daten unwiderruflich.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Konto löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konto endgültig löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Kurse,
                  Dokumente, Quizzes und Lernfortschritte werden unwiderruflich gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-4">
                <Label htmlFor="confirmDelete">
                  Tippe <span className="font-bold">LÖSCHEN</span> zur Bestätigung
                </Label>
                <Input
                  id="confirmDelete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="LÖSCHEN"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "LÖSCHEN" || deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Konto löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
