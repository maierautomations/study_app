"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { trackActivity } from "@/lib/gamification-client";

type KnowledgeQuestion = {
  question_text: string;
  difficulty: "easy" | "medium" | "hard";
  options: { label: string; text: string; is_correct: boolean }[];
  correct_answer: string;
  explanation: string;
};

type Assessment = {
  level: "beginner" | "intermediate" | "advanced";
  level_de: string;
  summary: string;
  recommendations: string[];
};

type KnowledgeCheckResult = {
  questions: KnowledgeQuestion[];
  assessment: Assessment;
};

interface KnowledgeCheckProps {
  courseId: string;
  hasDocuments: boolean;
}

export function KnowledgeCheck({ courseId, hasDocuments }: KnowledgeCheckProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KnowledgeCheckResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  async function handleStart() {
    setLoading(true);
    setResult(null);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);

    try {
      const res = await fetch("/api/quiz/knowledge-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Wissensstand-Check fehlgeschlagen");
      }

      setResult(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Wissensstand-Check fehlgeschlagen"
      );
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionIdx: number, label: string) {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: label }));
  }

  function handleNext() {
    if (result && currentQuestion < result.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  function handleFinish() {
    setShowResults(true);
    trackActivity("quiz_complete", courseId);
  }

  if (!hasDocuments) return null;

  // No result yet — show start button
  if (!result) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-3">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <h3 className="font-semibold">Wissensstand-Check</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Teste deinen aktuellen Wissensstand mit 5 aufsteigend schwieriger
            werdenden Fragen. Am Ende erhältst du eine Einschätzung und
            Lernempfehlungen.
          </p>
          <Button onClick={handleStart} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fragen werden erstellt...
              </>
            ) : (
              <>
                <BrainCircuit className="mr-2 h-4 w-4" />
                Wissensstand testen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show results + assessment
  if (showResults) {
    const correctCount = result.questions.filter((q, i) => {
      const selected = selectedAnswers[i];
      return q.options.find((o) => o.label === selected)?.is_correct;
    }).length;

    const levelColors: Record<string, string> = {
      beginner: "text-orange-500",
      intermediate: "text-blue-500",
      advanced: "text-green-500",
    };

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6 text-center">
            <BarChart3 className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-1">Ergebnis</h3>
            <p className="text-3xl font-bold mb-1">
              {correctCount} / {result.questions.length}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Fragen richtig beantwortet
            </p>

            <Badge
              variant="outline"
              className={`text-lg px-4 py-1 ${levelColors[result.assessment.level] ?? ""}`}
            >
              {result.assessment.level_de}
            </Badge>
            <p className="text-sm text-muted-foreground mt-3">
              {result.assessment.summary}
            </p>
          </CardContent>
        </Card>

        {result.assessment.recommendations.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Lernempfehlungen
              </h4>
              <ul className="space-y-2">
                {result.assessment.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary font-medium">{i + 1}.</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="py-4 space-y-3">
            <h4 className="font-medium text-sm">Fragenübersicht</h4>
            {result.questions.map((q, i) => {
              const selected = selectedAnswers[i];
              const isCorrect = q.options.find(
                (o) => o.label === selected
              )?.is_correct;

              return (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{q.question_text}</p>
                      <div className="mt-1 space-y-0.5">
                        {q.options.map((opt) => (
                          <p
                            key={opt.label}
                            className={`text-xs ${
                              opt.is_correct
                                ? "text-green-600 font-medium"
                                : opt.label === selected && !opt.is_correct
                                  ? "text-red-500 line-through"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {opt.label}) {opt.text}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Button onClick={handleStart} variant="outline" className="w-full">
          Erneut testen
        </Button>
      </div>
    );
  }

  // Interactive question view
  const question = result.questions[currentQuestion];
  const hasAnswered = selectedAnswers[currentQuestion] !== undefined;
  const allAnswered = Object.keys(selectedAnswers).length === result.questions.length;
  const difficultyLabel = {
    easy: "Leicht",
    medium: "Mittel",
    hard: "Schwer",
  }[question.difficulty];
  const difficultyColor = {
    easy: "text-green-500",
    medium: "text-yellow-500",
    hard: "text-red-500",
  }[question.difficulty];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          Wissensstand-Check
        </h3>
        <Badge variant="outline" className={difficultyColor}>
          {difficultyLabel}
        </Badge>
      </div>

      <Progress
        value={((currentQuestion + 1) / result.questions.length) * 100}
        className="h-1.5"
      />
      <p className="text-xs text-muted-foreground text-right">
        Frage {currentQuestion + 1} von {result.questions.length}
      </p>

      <Card>
        <CardContent className="py-5">
          <p className="font-medium mb-4">{question.question_text}</p>
          <div className="space-y-2">
            {question.options.map((opt) => {
              const isSelected = selectedAnswers[currentQuestion] === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  className={`w-full text-left p-3 border rounded-lg transition-colors text-sm ${
                    isSelected
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => selectAnswer(currentQuestion, opt.label)}
                >
                  <span className="font-medium mr-2">{opt.label})</span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
        >
          Zurück
        </Button>
        {currentQuestion < result.questions.length - 1 ? (
          <Button
            size="sm"
            disabled={!hasAnswered}
            onClick={handleNext}
          >
            Weiter
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!allAnswered}
            onClick={handleFinish}
          >
            Auswerten
            <BarChart3 className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
