"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
import { analyzeWeaknesses, computeQuizTrend, type DocumentWeakness, type QuizTrend } from "@/lib/analytics";
import type { QuizAnswer } from "@/types/database";

interface WeaknessChartProps {
  courseId: string;
  documents: Array<{ id: string; name: string }>;
  quizzes: Array<{ id: string; title: string; document_ids: string[] }>;
}

export function WeaknessChart({
  courseId,
  documents,
  quizzes,
}: WeaknessChartProps) {
  const [weaknesses, setWeaknesses] = useState<DocumentWeakness[]>([]);
  const [trends, setTrends] = useState<QuizTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Fetch all quiz attempts for this course's quizzes
      const quizIds = quizzes.map((q) => q.id);
      if (quizIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: attemptsRaw } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, answers, score, created_at")
        .in("quiz_id", quizIds)
        .order("created_at", { ascending: true });

      const attempts = (attemptsRaw as unknown as Array<{
        quiz_id: string;
        answers: QuizAnswer[];
        score: number;
        created_at: string;
      }>) ?? [];

      const w = analyzeWeaknesses(attempts, quizzes, documents);
      const t = computeQuizTrend(attempts, quizzes);
      setWeaknesses(w);
      setTrends(t);
      setLoading(false);
    }
    loadData();
  }, [courseId, documents, quizzes, supabase]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Analyse wird geladen...
        </CardContent>
      </Card>
    );
  }

  const hasData = weaknesses.length > 0 || trends.length > 0;

  if (!hasData) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Noch keine Daten</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Bearbeite Quizzes, um eine Schwächenanalyse und Fortschrittsübersicht
            zu erhalten.
          </p>
        </CardContent>
      </Card>
    );
  }

  const averageScore =
    trends.length > 0
      ? Math.round(trends.reduce((sum, t) => sum + t.score, 0) / trends.length)
      : 0;

  return (
    <div className="space-y-4">
      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Quizversuche</p>
            <p className="text-2xl font-bold">{trends.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Durchschnitt</p>
            <p className="text-2xl font-bold">{averageScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">
              {trends.length > 0 ? "Letzter Score" : "—"}
            </p>
            <p className="text-2xl font-bold">
              {trends.length > 0
                ? `${trends[trends.length - 1].score}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weakness analysis */}
      {weaknesses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              Schwächenanalyse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weaknesses.slice(0, 5).map((w) => (
              <div key={w.documentId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {w.errorRate >= 0.5 ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    ) : w.errorRate >= 0.25 ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    )}
                    <span className="text-sm truncate">{w.documentName}</span>
                  </div>
                  <Badge
                    variant={
                      w.errorRate >= 0.5
                        ? "destructive"
                        : w.errorRate >= 0.25
                          ? "secondary"
                          : "default"
                    }
                    className="shrink-0 ml-2"
                  >
                    {Math.round(w.errorRate * 100)}% Fehler
                  </Badge>
                </div>
                <Progress
                  value={(1 - w.errorRate) * 100}
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground">
                  {w.incorrectCount} von {w.totalQuestions} Fragen falsch
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quiz score history */}
      {trends.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Quiz-Verlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trends.slice(-8).map((t, i) => (
                <div key={`${t.quizId}-${i}`} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {new Date(t.date).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                  <div className="flex-1">
                    <Progress value={t.score} className="h-2" />
                  </div>
                  <span
                    className={`text-sm font-medium w-10 text-right ${
                      t.score >= 70
                        ? "text-green-600"
                        : t.score >= 50
                          ? "text-orange-600"
                          : "text-red-600"
                    }`}
                  >
                    {t.score}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
