"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { trackActivity } from "@/lib/gamification-client";
import { ExamResult } from "./exam-result";
import type { ExamQuestion, ExamAnswer } from "@/types/database";

interface ExamSessionProps {
  examId: string;
  courseId: string;
  courseName: string;
  title: string;
  questions: ExamQuestion[];
  timeLimitMinutes: number;
  totalPoints: number;
}

export function ExamSession({
  examId,
  courseId,
  courseName,
  title,
  questions,
  timeLimitMinutes,
  totalPoints,
}: ExamSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60); // seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    grade: string;
    earnedPoints: number;
    totalPoints: number;
    answers: ExamAnswer[];
  } | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [freeTextInput, setFreeTextInput] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const hasSubmittedRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.size;
  const progress = (answeredCount / questions.length) * 100;

  // Submit the exam
  const handleSubmit = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const answerArray = questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers.get(q.id) ?? "",
    }));

    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, answers: answerArray }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Fehler beim Abgeben");
        hasSubmittedRef.current = false;
        setIsSubmitting(false);
        return;
      }

      setResult(data);

      // Track activity for gamification
      await trackActivity("exam_complete", courseId, {
        score: data.score,
        grade: data.grade,
        questionCount: questions.length,
      });
    } catch {
      toast.error("Fehler beim Abgeben der Klausur");
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
    }
  }, [answers, courseId, examId, questions]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — auto-submit
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleSubmit]);

  // Format time as MM:SS
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function selectAnswer(questionId: string, answer: string) {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, answer);
      return next;
    });
  }

  function handleFreeTextSubmit() {
    if (freeTextInput.trim()) {
      selectAnswer(currentQuestion.id, freeTextInput.trim());
      setFreeTextInput("");
    }
  }

  // Sync free text input when navigating to a free text question
  useEffect(() => {
    if (currentQuestion?.question_type === "free_text") {
      setFreeTextInput(answers.get(currentQuestion.id) ?? "");
    }
  }, [currentIndex, currentQuestion, answers]);

  // Show result screen
  if (result) {
    return (
      <ExamResult
        courseId={courseId}
        courseName={courseName}
        title={title}
        questions={questions}
        answers={result.answers}
        score={result.score}
        grade={result.grade}
        earnedPoints={result.earnedPoints}
        totalPoints={result.totalPoints}
      />
    );
  }

  const timeWarning = timeLeft < 300; // < 5 min
  const timeCritical = timeLeft < 60; // < 1 min

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{courseName}</p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            timeCritical
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 animate-pulse"
              : timeWarning
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                : "bg-muted text-foreground"
          }`}
        >
          <Clock className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {answeredCount} von {questions.length} beantwortet
          </span>
          <span>{totalPoints} Punkte gesamt</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question navigation pills */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const isAnswered = answers.has(q.id);
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all
                ${
                  isCurrent
                    ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground"
                    : isAnswered
                      ? "bg-primary/20 text-primary hover:bg-primary/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              Frage {currentIndex + 1} von {questions.length}
            </Badge>
            <Badge variant="secondary">
              {currentQuestion.points}{" "}
              {currentQuestion.points === 1 ? "Punkt" : "Punkte"}
            </Badge>
          </div>
          <CardTitle className="text-lg mt-2">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.question_type === "free_text" ? (
            <div className="flex gap-2">
              <Input
                value={freeTextInput}
                onChange={(e) => setFreeTextInput(e.target.value)}
                placeholder="Deine Antwort..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFreeTextSubmit();
                }}
              />
              <Button
                size="sm"
                onClick={handleFreeTextSubmit}
                disabled={!freeTextInput.trim()}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {(currentQuestion.options.length > 0
                ? currentQuestion.options
                : currentQuestion.question_type === "true_false"
                  ? [
                      { label: "Wahr", text: "Wahr", is_correct: false },
                      { label: "Falsch", text: "Falsch", is_correct: false },
                    ]
                  : []
              ).map((option) => {
                const isSelected =
                  answers.get(currentQuestion.id) === option.label;
                return (
                  <button
                    key={option.label}
                    onClick={() =>
                      selectAnswer(currentQuestion.id, option.label)
                    }
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                      ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0
                        ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {option.label}
                    </span>
                    <span className="text-sm">{option.text}</span>
                  </button>
                );
              })}
            </>
          )}

          {answers.has(currentQuestion.id) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Check className="h-3 w-3 text-green-500" />
              Beantwortet
              {currentQuestion.question_type === "free_text" &&
                `: "${answers.get(currentQuestion.id)}"`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation + Submit */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Zurück
        </Button>

        <div className="flex gap-2">
          {!showConfirmSubmit ? (
            <Button
              variant="destructive"
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              Klausur abgeben
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-destructive/10 p-2 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm">
                {answeredCount < questions.length
                  ? `${questions.length - answeredCount} Fragen unbeantwortet!`
                  : "Wirklich abgeben?"}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Wird ausgewertet..." : "Ja, abgeben"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Abbrechen
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() =>
            setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
          }
          disabled={currentIndex === questions.length - 1}
        >
          Weiter
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
