"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  Loader2,
  History,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ExamSession } from "@/components/exam/exam-session";
import type { ExamQuestion, ExamAttempt } from "@/types/database";

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const supabase = createClient();

  const [courseName, setCourseName] = useState("");
  const [hasReadyDocs, setHasReadyDocs] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("60");
  const [questionCount, setQuestionCount] = useState("20");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pastAttempts, setPastAttempts] = useState<ExamAttempt[]>([]);

  // Active exam session state
  const [activeExam, setActiveExam] = useState<{
    examId: string;
    title: string;
    questions: ExamQuestion[];
    timeLimitMinutes: number;
    totalPoints: number;
  } | null>(null);

  // Load course data + past attempts
  useEffect(() => {
    async function load() {
      const { data: courseRaw } = await supabase
        .from("courses")
        .select("name")
        .eq("id", courseId)
        .single();
      const course = courseRaw as unknown as { name: string } | null;
      if (course) setCourseName(course.name);

      const { data: docsRaw } = await supabase
        .from("documents")
        .select("id")
        .eq("course_id", courseId)
        .eq("status", "ready");
      const docs = docsRaw as unknown as Array<{ id: string }> | null;
      setHasReadyDocs((docs?.length ?? 0) > 0);

      const { data: attemptsRaw } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("course_id", courseId)
        .not("completed_at", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      setPastAttempts(
        (attemptsRaw as unknown as ExamAttempt[] | null) ?? []
      );

      setLoading(false);
    }
    load();
  }, [courseId, supabase]);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/exam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          timeLimitMinutes: parseInt(timeLimitMinutes),
          questionCount: parseInt(questionCount),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast.error("KI-Limit erreicht", { description: data.error });
        } else {
          toast.error(data.error || "Generierung fehlgeschlagen");
        }
        setIsGenerating(false);
        return;
      }

      // Fetch the generated exam
      const { data: examRaw } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("id", data.examId)
        .single();
      const exam = examRaw as unknown as ExamAttempt | null;

      if (!exam) {
        toast.error("Klausur konnte nicht geladen werden");
        setIsGenerating(false);
        return;
      }

      setActiveExam({
        examId: exam.id,
        title: exam.title,
        questions: exam.questions as unknown as ExamQuestion[],
        timeLimitMinutes: exam.time_limit_minutes,
        totalPoints: exam.total_points,
      });
    } catch {
      toast.error("Fehler bei der Klausur-Generierung");
    } finally {
      setIsGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show active exam session
  if (activeExam) {
    return (
      <ExamSession
        examId={activeExam.examId}
        courseId={courseId}
        courseName={courseName}
        title={activeExam.title}
        questions={activeExam.questions}
        timeLimitMinutes={activeExam.timeLimitMinutes}
        totalPoints={activeExam.totalPoints}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Zurück zu {courseName || "Kurs"}
      </Link>

      <div className="flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Klausur-Simulator
          </h1>
          <p className="text-muted-foreground">
            Simuliere eine realistische Probeklausur mit Zeitlimit und Benotung
          </p>
        </div>
      </div>

      {!hasReadyDocs ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Keine Dokumente vorhanden
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Lade zuerst Dokumente in deinen Kurs hoch, bevor du eine
              Probeklausur erstellen kannst.
            </p>
            <Button onClick={() => router.push(`/dashboard/courses/${courseId}`)}>
              Zum Kurs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Klausur konfigurieren
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Zeitlimit</label>
                <Select
                  value={timeLimitMinutes}
                  onValueChange={setTimeLimitMinutes}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Minuten</SelectItem>
                    <SelectItem value="60">60 Minuten</SelectItem>
                    <SelectItem value="90">90 Minuten</SelectItem>
                    <SelectItem value="120">120 Minuten</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fragenanzahl</label>
                <Select
                  value={questionCount}
                  onValueChange={setQuestionCount}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Fragen</SelectItem>
                    <SelectItem value="15">15 Fragen</SelectItem>
                    <SelectItem value="20">20 Fragen</SelectItem>
                    <SelectItem value="30">30 Fragen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground space-y-1">
              <p>
                Die Klausur enthält einen Mix aus Multiple-Choice,
                Wahr/Falsch und Freitext-Fragen.
              </p>
              <p>
                Fragen zu deinen Schwächen werden automatisch stärker
                gewichtet.
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Klausur wird erstellt...
                </>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Probeklausur starten
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Past attempts */}
      {pastAttempts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Bisherige Klausuren
          </h2>
          {pastAttempts.map((attempt) => {
            const passed =
              parseFloat(attempt.grade.replace(",", ".")) <= 4.0;
            return (
              <Card key={attempt.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {passed ? (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{attempt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.created_at).toLocaleDateString(
                          "de-DE",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}{" "}
                        &middot; {attempt.time_limit_minutes} min &middot;{" "}
                        {(attempt.questions as unknown[]).length} Fragen
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">{attempt.grade}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.score}%
                      </p>
                    </div>
                    <Badge variant={passed ? "default" : "destructive"}>
                      {passed ? "Bestanden" : "Nicht bestanden"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
