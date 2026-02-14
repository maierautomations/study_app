"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Document } from "@/types/database";

export default function NewFlashcardsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [count, setCount] = useState("20");
  const [focusArea, setFocusArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    async function fetchDocuments() {
      const { data: dataRaw } = await supabase
        .from("documents")
        .select("*")
        .eq("course_id", courseId)
        .eq("status", "ready")
        .order("created_at", { ascending: false });

      setDocuments((dataRaw as unknown as Document[] | null) ?? []);
      setLoadingDocs(false);
    }
    fetchDocuments();
  }, [courseId, supabase]);

  function toggleDocument(docId: string) {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  }

  function selectAll() {
    setSelectedDocIds(
      selectedDocIds.length === documents.length
        ? []
        : documents.map((d) => d.id)
    );
  }

  async function handleGenerate() {
    if (selectedDocIds.length === 0) {
      toast.error("Bitte wähle mindestens ein Dokument aus");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          documentIds: selectedDocIds,
          title: title.trim() || undefined,
          count: parseInt(count),
          focusArea: focusArea.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Flashcard-Generierung fehlgeschlagen");
      }

      toast.success("Flashcards wurden generiert!");
      router.push(`/dashboard/courses/${courseId}/flashcards/${data.setId}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Flashcard-Generierung fehlgeschlagen"
      );
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Zurück zum Kurs
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Flashcards generieren
        </h1>
        <p className="text-muted-foreground mt-1">
          Wähle Dokumente für deine KI-generierten Lernkarten.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fc-title">Titel (optional)</Label>
          <Input
            id="fc-title"
            placeholder="z.B. Grundbegriffe der Analysis"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fc-focus-area">Fokusbereich (optional)</Label>
          <Input
            id="fc-focus-area"
            placeholder="z.B. Kapitel 3, NLP, Lineare Algebra..."
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Die KI konzentriert sich auf diesen Bereich.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Dokumente auswählen *</Label>
            {documents.length > 1 && (
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedDocIds.length === documents.length
                  ? "Keine auswählen"
                  : "Alle auswählen"}
              </Button>
            )}
          </div>

          {loadingDocs ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Dokumente werden geladen...
              </CardContent>
            </Card>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Keine verarbeiteten Dokumente vorhanden.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    className={`w-full flex items-center gap-3 p-3 text-left border rounded-lg transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleDocument(doc.id)}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/50"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Anzahl Karten</Label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 Karten</SelectItem>
              <SelectItem value="20">20 Karten</SelectItem>
              <SelectItem value="30">30 Karten</SelectItem>
              <SelectItem value="50">50 Karten</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || selectedDocIds.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Flashcards werden generiert...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Flashcards generieren
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
