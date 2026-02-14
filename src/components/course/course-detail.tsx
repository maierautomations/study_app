"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  BrainCircuit,
  Layers,
  MessageSquare,
  Upload,
  Sparkles,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  BarChart3,
  GraduationCap,
  Zap,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CourseFormDialog } from "./course-form-dialog";
import { DeleteCourseDialog } from "./delete-course-dialog";
import { DocumentUpload } from "@/components/document/document-upload";
import { SummaryView } from "@/components/document/summary-view";
import { GlossaryView } from "@/components/document/glossary-view";
import { DeleteDocumentDialog } from "@/components/document/delete-document-dialog";
import { CreateFlashcardDialog } from "@/components/flashcard/flashcard-editor";
import { WeaknessChart } from "@/components/progress/weakness-chart";
import type { Course, Document, Quiz, FlashcardSet } from "@/types/database";

interface CourseDetailProps {
  course: Course;
  documents: Document[];
  quizzes: Quiz[];
  flashcardSets: FlashcardSet[];
}

export function CourseDetail({
  course,
  documents,
  quizzes,
  flashcardSets,
}: CourseDetailProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [retryingDocId, setRetryingDocId] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const activeTab = searchParams.get("tab") ?? "documents";

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  async function retryDocument(docId: string) {
    setRetryingDocId(docId);
    try {
      await supabase
        .from("documents")
        .update({ status: "uploading" } as never)
        .eq("id", docId);

      const res = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (data.processed > 0) {
        toast.success("Dokument erfolgreich verarbeitet");
      } else {
        toast.error("Verarbeitung fehlgeschlagen", {
          description: data.error || "Prüfe deine OpenAI API Credits auf platform.openai.com/billing",
        });
      }
      router.refresh();
    } catch {
      toast.error("Verarbeitung fehlgeschlagen");
    } finally {
      setRetryingDocId(null);
    }
  }

  function triggerExport(type: string, contentId: string) {
    window.open(
      `/api/export/${type}?courseId=${course.id}&contentId=${contentId}`,
      "_blank"
    );
  }

  async function handleGenerateAll() {
    const readyDocs = documents.filter((d) => d.status === "ready");
    if (readyDocs.length === 0) return;

    setIsGeneratingAll(true);
    try {
      const res = await fetch("/api/documents/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          documentIds: readyDocs.map((d) => d.id),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast.error("KI-Limit erreicht", { description: data.error });
        } else {
          toast.error(data.error || "Generierung fehlgeschlagen");
        }
        return;
      }

      toast.success("Alles generiert!", {
        description: `${data.generated.questions} Quizfragen, ${data.generated.flashcards} Flashcards und Zusammenfassung erstellt.`,
      });
      router.refresh();
    } catch {
      toast.error("Generierung fehlgeschlagen");
    } finally {
      setIsGeneratingAll(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Link
        href="/dashboard/courses"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Zurück zu Kursen
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: course.color ?? "#3b82f6" }}
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {course.name}
            </h1>
            {course.description && (
              <p className="text-muted-foreground mt-1">
                {course.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Dokumente
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {documents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-1.5">
            <BrainCircuit className="h-4 w-4" />
            Quizzes
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {quizzes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Flashcards
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {flashcardSets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="exam" className="gap-1.5">
            <GraduationCap className="h-4 w-4" />
            Klausur
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Fortschritt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6 space-y-6">
          <DocumentUpload courseId={course.id} />

          {documents.some((d) => d.status === "ready") && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">Alles auf einmal generieren</p>
                  <p className="text-xs text-muted-foreground">
                    10 Quizfragen + 20 Flashcards + Zusammenfassung in einem Schritt (spart KI-Kontingent)
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerateAll}
                  disabled={isGeneratingAll}
                >
                  {isGeneratingAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird generiert...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Alles generieren
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Hochgeladene Dokumente
              </h3>
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.file_size / 1024).toFixed(0)} KB &middot;{" "}
                          {doc.file_type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === "error" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          disabled={retryingDocId === doc.id}
                          onClick={() => retryDocument(doc.id)}
                        >
                          {retryingDocId === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          <span className="ml-1 text-xs">
                            {retryingDocId === doc.id ? "Wird verarbeitet..." : "Erneut verarbeiten"}
                          </span>
                        </Button>
                      )}
                      <DeleteDocumentDialog
                        documentId={doc.id}
                        documentName={doc.name}
                        filePath={doc.file_path}
                      />
                      <Badge
                        variant={
                          doc.status === "ready"
                            ? "default"
                            : doc.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {doc.status === "ready"
                          ? "Bereit"
                          : doc.status === "processing"
                            ? "Wird verarbeitet..."
                            : doc.status === "uploading"
                              ? "Wird hochgeladen..."
                              : "Fehler"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {documents.some((d) => d.status === "ready") && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Zusammenfassungen
              </h3>
              {documents
                .filter((d) => d.status === "ready")
                .map((doc) => (
                  <SummaryView
                    key={doc.id}
                    documentId={doc.id}
                    documentName={doc.name}
                    cachedSummary={(doc as Document & { summary?: string | null }).summary ?? null}
                    courseId={course.id}
                  />
                ))}
            </div>
          )}

          {documents.some((d) => d.status === "ready") && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Fachbegriff-Glossar
              </h3>
              {documents
                .filter((d) => d.status === "ready")
                .map((doc) => (
                  <GlossaryView
                    key={doc.id}
                    documentId={doc.id}
                    documentName={doc.name}
                    cachedGlossary={(doc as Document & { glossary?: string | null }).glossary ?? null}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          {quizzes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Noch keine Quizzes
                </h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Lade zuerst Dokumente hoch. Dann kannst du KI-generierte
                  Quizfragen erstellen.
                </p>
                {documents.some((d) => d.status === "ready") && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/courses/${course.id}/quiz/new`
                      )
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Quiz generieren
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-3">
                    <Link
                      href={`/dashboard/courses/${course.id}/quiz/${quiz.id}`}
                      className="flex-1"
                    >
                      <p className="font-medium text-sm">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {quiz.question_count} Fragen &middot;{" "}
                        {quiz.difficulty === "easy"
                          ? "Leicht"
                          : quiz.difficulty === "medium"
                            ? "Mittel"
                            : "Schwer"}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Als PDF exportieren"
                        onClick={(e) => {
                          e.preventDefault();
                          triggerExport("quiz", quiz.id);
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <BrainCircuit className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {documents.some((d) => d.status === "ready") && (
                <Button
                  className="mt-4"
                  onClick={() =>
                    router.push(
                      `/dashboard/courses/${course.id}/quiz/new`
                    )
                  }
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Neues Quiz generieren
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="mt-6">
          {flashcardSets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Noch keine Flashcards
                </h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Lade zuerst Dokumente hoch. Dann kannst du KI-generierte
                  Flashcards erstellen.
                </p>
                <div className="flex gap-2">
                  {documents.some((d) => d.status === "ready") && (
                    <Button
                      onClick={() =>
                        router.push(
                          `/dashboard/courses/${course.id}/flashcards/new`
                        )
                      }
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Flashcards generieren
                    </Button>
                  )}
                  <CreateFlashcardDialog
                    courseId={course.id}
                    onCreated={() => window.location.reload()}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {flashcardSets.map((set) => (
                <Card key={set.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-3">
                    <Link
                      href={`/dashboard/courses/${course.id}/flashcards/${set.id}`}
                      className="flex-1"
                    >
                      <p className="font-medium text-sm">{set.title}</p>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Als PDF exportieren"
                        onClick={(e) => {
                          e.preventDefault();
                          triggerExport("flashcards", set.id);
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 text-xs"
                        title="Anki-Export (Pro)"
                        onClick={(e) => {
                          e.preventDefault();
                          triggerExport("anki", set.id);
                        }}
                      >
                        Anki
                      </Button>
                      <Layers className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2 mt-4">
                {documents.some((d) => d.status === "ready") && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/courses/${course.id}/flashcards/new`
                      )
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Neue Flashcards generieren
                  </Button>
                )}
                <CreateFlashcardDialog
                  courseId={course.id}
                  onCreated={() => window.location.reload()}
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">KI-Chat</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                {documents.some((d) => d.status === "ready")
                  ? "Stelle Fragen zu deinen Dokumenten und erhalte KI-gestützte Antworten."
                  : "Lade zuerst Dokumente hoch, um den KI-Chat nutzen zu können."}
              </p>
              {documents.some((d) => d.status === "ready") && (
                <Button
                  onClick={() =>
                    router.push(
                      `/dashboard/courses/${course.id}/chat`
                    )
                  }
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat öffnen
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam" className="mt-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Klausur-Simulator
              </h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                {documents.some((d) => d.status === "ready")
                  ? "Simuliere eine realistische Probeklausur mit Zeitlimit, Punkteverteilung und deutschem Notensystem."
                  : "Lade zuerst Dokumente hoch, um den Klausur-Simulator nutzen zu können."}
              </p>
              {documents.some((d) => d.status === "ready") && (
                <Button
                  onClick={() =>
                    router.push(
                      `/dashboard/courses/${course.id}/exam`
                    )
                  }
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Probeklausur starten
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <WeaknessChart
            courseId={course.id}
            documents={documents
              .filter((d) => d.status === "ready")
              .map((d) => ({ id: d.id, name: d.name }))}
            quizzes={quizzes.map((q) => ({
              id: q.id,
              title: q.title,
              document_ids: q.document_ids,
            }))}
          />
        </TabsContent>
      </Tabs>

      <CourseFormDialog
        course={course}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
      <DeleteCourseDialog
        course={course}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        redirectTo="/dashboard/courses"
      />
    </div>
  );
}
