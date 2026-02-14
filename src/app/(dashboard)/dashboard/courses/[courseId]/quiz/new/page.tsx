"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Document } from "@/types/database";

export default function NewQuizPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState("10");
  const [questionTypes, setQuestionTypes] = useState({
    multiple_choice: true,
    true_false: true,
    free_text: true,
  });
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

  function toggleQuestionType(type: keyof typeof questionTypes) {
    const newTypes = { ...questionTypes, [type]: !questionTypes[type] };
    // Ensure at least one type is selected
    if (!newTypes.multiple_choice && !newTypes.true_false && !newTypes.free_text) {
      toast.error("Mindestens ein Fragetyp muss ausgewählt sein");
      return;
    }
    setQuestionTypes(newTypes);
  }

  async function handleGenerate() {
    if (selectedDocIds.length === 0) {
      toast.error("Bitte wähle mindestens ein Dokument aus");
      return;
    }

    const selectedTypes = Object.entries(questionTypes)
      .filter(([, v]) => v)
      .map(([k]) => k);

    setLoading(true);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          documentIds: selectedDocIds,
          difficulty,
          questionCount: parseInt(questionCount),
          questionTypes: selectedTypes,
          title: title.trim() || undefined,
          focusArea: focusArea.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Quiz-Generierung fehlgeschlagen");
      }

      toast.success("Quiz wurde generiert!");
      router.push(`/dashboard/courses/${courseId}/quiz/${data.quizId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Quiz-Generierung fehlgeschlagen"
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
        <h1 className="text-3xl font-bold tracking-tight">Quiz generieren</h1>
        <p className="text-muted-foreground mt-1">
          Wähle Dokumente und Einstellungen für dein KI-generiertes Quiz.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="quiz-title">Titel (optional)</Label>
          <Input
            id="quiz-title"
            placeholder="z.B. Kapitel 3 - Lineare Gleichungssysteme"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="focus-area">Fokusbereich (optional)</Label>
          <Input
            id="focus-area"
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
                Keine verarbeiteten Dokumente vorhanden. Lade zuerst Dokumente
                im Kurs hoch.
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
                      <p className="text-xs text-muted-foreground">
                        {doc.file_type.toUpperCase()} &middot;{" "}
                        {(doc.file_size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Schwierigkeit</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Leicht</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="hard">Schwer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Anzahl Fragen</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Fragen</SelectItem>
                <SelectItem value="10">10 Fragen</SelectItem>
                <SelectItem value="15">15 Fragen</SelectItem>
                <SelectItem value="20">20 Fragen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Fragetypen</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "multiple_choice" as const, label: "Multiple Choice" },
              { key: "true_false" as const, label: "Wahr / Falsch" },
              { key: "free_text" as const, label: "Offene Fragen" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                  questionTypes[key]
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => toggleQuestionType(key)}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                    questionTypes[key]
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/50"
                  }`}
                >
                  {questionTypes[key] && <Check className="h-3 w-3" />}
                </div>
                {label}
              </button>
            ))}
          </div>
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
              Quiz wird generiert...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Quiz generieren
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
