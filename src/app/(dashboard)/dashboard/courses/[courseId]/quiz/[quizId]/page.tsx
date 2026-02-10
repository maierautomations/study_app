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
} from "lucide-react";
import { toast } from "sonner";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuiz() {
      const [{ data: quizData }, { data: questionsData }] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", quizId).single(),
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index", { ascending: true }),
      ]);

      if (quizData) setQuiz(quizData);
      if (questionsData) setQuestions(questionsData);
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
    return (currentQuestion.options as QuizQuestionOption[]) ?? [];
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
      });
    }
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFreeTextAnswer("");
    setShowResult(false);
    setAnswers([]);
    setQuizCompleted(false);
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

    return (
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Trophy
              className={`h-16 w-16 mb-4 ${score >= 70 ? "text-yellow-500" : "text-muted-foreground"}`}
            />
            <h2 className="text-2xl font-bold mb-2">Quiz abgeschlossen!</h2>
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
                      <p className="text-sm font-medium">{q.question_text}</p>
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

            <div className="flex gap-3">
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
            {currentQuestion.question_text}
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
              <p className="text-sm text-muted-foreground">
                {currentQuestion.explanation}
              </p>
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
