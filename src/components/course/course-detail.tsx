"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CourseFormDialog } from "./course-form-dialog";
import { DeleteCourseDialog } from "./delete-course-dialog";
import { DocumentUpload } from "@/components/document/document-upload";
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
  const router = useRouter();
  const supabase = createClient();

  async function retryDocument(docId: string) {
    setRetryingDocId(docId);
    try {
      await supabase
        .from("documents")
        .update({ status: "uploading" })
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

      <Tabs defaultValue="documents">
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
        </TabsList>

        <TabsContent value="documents" className="mt-6 space-y-6">
          <DocumentUpload courseId={course.id} />

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
                <Link
                  key={quiz.id}
                  href={`/dashboard/courses/${course.id}/quiz/${quiz.id}`}
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-sm">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.question_count} Fragen &middot;{" "}
                          {quiz.difficulty === "easy"
                            ? "Leicht"
                            : quiz.difficulty === "medium"
                              ? "Mittel"
                              : "Schwer"}
                        </p>
                      </div>
                      <BrainCircuit className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
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
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {flashcardSets.map((set) => (
                <Link
                  key={set.id}
                  href={`/dashboard/courses/${course.id}/flashcards/${set.id}`}
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-sm">{set.title}</p>
                      </div>
                      <Layers className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {documents.some((d) => d.status === "ready") && (
                <Button
                  className="mt-4"
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
