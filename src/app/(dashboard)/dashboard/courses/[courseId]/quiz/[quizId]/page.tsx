"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Bot,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { trackActivity } from "@/lib/gamification-client";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import type { Quiz, QuizQuestion, QuizQuestionOption } from "@/types/database";

type Answer = {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
};

export default function QuizPlayPage() {
  const { courseId, quizId } = useParams<{
    courseId: string;
    quizId: string;
  }>();
  const router = useRouter();
  const supabase = createClient();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [deepExplanations, setDeepExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      const [{ data: quizDataRaw }, { data: questionsDataRaw }] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", quizId).single(),
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index", { ascending: true }),
      ]);
      const quizData = quizDataRaw as unknown as Quiz | null;
      const questionsData = questionsDataRaw as unknown as QuizQuestion[] | null;

      if (quizData) setQuiz(quizData);
      if (questionsData) {
        setQuestions(questionsData);
        setAllQuestions(questionsData);
      }
      setLoading(false);
    }
    fetchQuiz();
  }, [quizId, supabase]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length
    ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100
    : 0;

  function getOptions(): QuizQuestionOption[] {
    if (!currentQuestion) return [];
    const opts = (currentQuestion.options as QuizQuestionOption[]) ?? [];
    // Fallback for true/false questions with missing options
    if (currentQuestion.question_type === "true_false" && opts.length === 0) {
      return [
        { label: "Wahr", text: "Wahr", is_correct: currentQuestion.correct_answer === "Wahr" },
        { label: "Falsch", text: "Falsch", is_correct: currentQuestion.correct_answer === "Falsch" },
      ];
    }
    return opts;
  }

  function handleAnswer() {
    if (!currentQuestion) return;

    const answer =
      currentQuestion.question_type === "free_text"
        ? freeTextAnswer.trim()
        : selectedAnswer;

    if (!answer) return;

    const isCorrect =
      currentQuestion.question_type === "free_text"
        ? answer.toLowerCase() ===
          currentQuestion.correct_answer.toLowerCase()
        : answer === currentQuestion.correct_answer;

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        isCorrect,
      },
    ]);
    setShowResult(true);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setFreeTextAnswer("");
      setShowResult(false);
    } else {
      finishQuiz();
    }
  }

  async function finishQuiz() {
    setQuizCompleted(true);

    const score = Math.round(
      (answers.filter((a) => a.isCorrect).length / questions.length) * 100
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("quiz_attempts").insert({
        quiz_id: quizId,
        user_id: user.id,
        answers: answers.map((a) => ({
          question_id: a.questionId,
          selected_answer: a.selectedAnswer,
          is_correct: a.isCorrect,
        })),
        score,
        completed_at: new Date().toISOString(),
      } as never);
    }

    // Track gamification
    trackActivity(
      score === 100 ? "perfect_quiz" : "quiz_complete",
      courseId,
      { score, questionCount: questions.length }
    );
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFreeTextAnswer("");
    setShowResult(false);
    setAnswers([]);
    setQuizCompleted(false);
    setReviewMode(false);
    setReviewTotal(0);
    setQuestions(allQuestions);
  }

  function startReviewMode() {
    const wrongQuestionIds = answers
      .filter((a) => !a.isCorrect)
      .map((a) => a.questionId);
    const wrongQuestions = questions.filter((q) =>
      wrongQuestionIds.includes(q.id)
    );
    if (wrongQuestions.length === 0) return;
    setReviewMode(true);
    setReviewTotal(wrongQuestions.length);
    setQuestions(wrongQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFreeTextAnswer("");
    setShowResult(false);
    setAnswers([]);
    setQuizCompleted(false);
  }

  async function requestDeepExplanation(question: QuizQuestion, selectedAnswer: string) {
    if (loadingExplanation || deepExplanations[question.id]) return;
    setLoadingExplanation(question.id);
    try {
      const res = await fetch("/api/quiz/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: question.question_text,
          correctAnswer: question.correct_answer,
          selectedAnswer,
          explanation: question.explanation,
          courseId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Fehler" }));
        toast.error(err.error || "Erklärung konnte nicht geladen werden.");
        return;
      }
      const data = await res.json();
      setDeepExplanations((prev) => ({ ...prev, [question.id]: data.explanation }));
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setLoadingExplanation(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Quiz wird geladen...</p>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Quiz nicht gefunden.</p>
        <Button asChild className="mt-4">
          <Link href={`/dashboard/courses/${courseId}`}>Zurück zum Kurs</Link>
        </Button>
      </div>
    );
  }

  if (quizCompleted) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);

    const wrongCount = questions.length - correctCount;

    return (
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            {reviewMode && (
              <Badge variant="secondary" className="mb-4">
                Review-Modus: {reviewTotal} Fragen wiederholt
              </Badge>
            )}
            <Trophy
              className={`h-16 w-16 mb-4 ${score >= 70 ? "text-yellow-500" : "text-muted-foreground"}`}
            />
            <h2 className="text-2xl font-bold mb-2">
              {reviewMode ? "Review abgeschlossen!" : "Quiz abgeschlossen!"}
            </h2>
            <p className="text-4xl font-bold mb-1">{score}%</p>
            <p className="text-muted-foreground mb-6">
              {correctCount} von {questions.length} Fragen richtig
            </p>

            <div className="w-full space-y-3 mb-6">
              {questions.map((q, i) => {
                const answer = answers[i];
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      answer?.isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {answer?.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <MarkdownRenderer content={q.question_text} className="text-sm font-medium" compact />
                      {!answer?.isCorrect && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Richtige Antwort: {q.correct_answer}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {wrongCount > 0 && (
                <Button variant="destructive" onClick={startReviewMode}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {wrongCount} Fehler wiederholen
                </Button>
              )}
              <Button variant="outline" onClick={restartQuiz}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Nochmal
              </Button>
              <Button asChild>
                <Link href={`/dashboard/courses/${courseId}`}>
                  Zurück zum Kurs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = getOptions();

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {reviewMode && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
          <RotateCcw className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="text-orange-700 dark:text-orange-400 font-medium">
            Review-Modus: {reviewTotal} falsch beantwortete Fragen
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/courses/${courseId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Abbrechen
        </Link>
        <span className="text-sm text-muted-foreground">
          Frage {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Navigation pills */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const answered = answers.some((a) => a.questionId === q.id);
          const isCurrent = i === currentIndex;
          const wasCorrect = answers.find((a) => a.questionId === q.id)?.isCorrect;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                if (answered || i <= currentIndex) {
                  // Allow navigating to answered or current/past questions (view only)
                }
              }}
              className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : answered
                    ? wasCorrect
                      ? "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">
              {currentQuestion.question_type === "multiple_choice"
                ? "Multiple Choice"
                : currentQuestion.question_type === "true_false"
                  ? "Wahr / Falsch"
                  : "Freitext"}
            </Badge>
          </div>
          <CardTitle className="text-xl leading-relaxed">
            <MarkdownRenderer content={currentQuestion.question_text} compact />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.question_type === "free_text" ? (
            <Input
              placeholder="Deine Antwort..."
              value={freeTextAnswer}
              onChange={(e) => setFreeTextAnswer(e.target.value)}
              disabled={showResult}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !showResult && freeTextAnswer.trim()) {
                  handleAnswer();
                }
              }}
            />
          ) : (
            options.map((option) => {
              const isSelected = selectedAnswer === option.label;
              const isCorrect =
                showResult && option.label === currentQuestion.correct_answer;
              const isWrong = showResult && isSelected && !option.is_correct;

              return (
                <button
                  key={option.label}
                  type="button"
                  disabled={showResult}
                  className={`w-full flex items-center gap-3 p-4 text-left border rounded-lg transition-colors ${
                    isCorrect
                      ? "border-green-500 bg-green-500/10"
                      : isWrong
                        ? "border-red-500 bg-red-500/10"
                        : isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedAnswer(option.label)}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium shrink-0 ${
                      isCorrect
                        ? "border-green-500 bg-green-500 text-white"
                        : isWrong
                          ? "border-red-500 bg-red-500 text-white"
                          : isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/50"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="text-sm">{option.text}</span>
                </button>
              );
            })
          )}

          {showResult && (
            <div
              className={`p-4 rounded-lg mt-4 ${
                answers[answers.length - 1]?.isCorrect
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {answers[answers.length - 1]?.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Richtig!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      Falsch — Richtige Antwort: {currentQuestion.correct_answer}
                    </span>
                  </>
                )}
              </div>
              <MarkdownRenderer
                content={currentQuestion.explanation || ""}
                className="text-muted-foreground"
                compact
              />
              {!answers[answers.length - 1]?.isCorrect && (
                <div className="mt-3">
                  {deepExplanations[currentQuestion.id] ? (
                    <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-primary">
                        <Bot className="h-3.5 w-3.5" />
                        KI-Erklärung
                      </div>
                      <MarkdownRenderer content={deepExplanations[currentQuestion.id]} compact />
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={loadingExplanation === currentQuestion.id}
                      onClick={() =>
                        requestDeepExplanation(
                          currentQuestion,
                          answers[answers.length - 1]?.selectedAnswer ?? ""
                        )
                      }
                    >
                      {loadingExplanation === currentQuestion.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Bot className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Ausführlich erklären
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {!showResult ? (
          <Button
            onClick={handleAnswer}
            disabled={
              currentQuestion.question_type === "free_text"
                ? !freeTextAnswer.trim()
                : !selectedAnswer
            }
          >
            Antwort prüfen
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex < questions.length - 1 ? (
              <>
                Nächste Frage
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Ergebnis anzeigen"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
