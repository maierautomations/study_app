"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  GraduationCap,
} from "lucide-react";
import type { ExamQuestion, ExamAnswer } from "@/types/database";

interface ExamResultProps {
  courseId: string;
  courseName: string;
  title: string;
  questions: ExamQuestion[];
  answers: ExamAnswer[];
  score: number;
  grade: string;
  earnedPoints: number;
  totalPoints: number;
}

function gradeLabel(grade: string): string {
  const g = parseFloat(grade.replace(",", "."));
  if (g <= 1.0) return "Sehr gut";
  if (g <= 1.5) return "Sehr gut";
  if (g <= 2.5) return "Gut";
  if (g <= 3.5) return "Befriedigend";
  if (g <= 4.0) return "Ausreichend";
  return "Nicht bestanden";
}

function gradeColor(grade: string): string {
  const g = parseFloat(grade.replace(",", "."));
  if (g <= 1.5) return "text-green-600 dark:text-green-400";
  if (g <= 2.5) return "text-blue-600 dark:text-blue-400";
  if (g <= 3.5) return "text-yellow-600 dark:text-yellow-400";
  if (g <= 4.0) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function gradeBgColor(grade: string): string {
  const g = parseFloat(grade.replace(",", "."));
  if (g <= 1.5) return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
  if (g <= 2.5) return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
  if (g <= 3.5) return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
  if (g <= 4.0) return "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800";
  return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
}

export function ExamResult({
  courseId,
  courseName,
  title,
  questions,
  answers,
  score,
  grade,
  earnedPoints,
  totalPoints,
}: ExamResultProps) {
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));
  const passed = parseFloat(grade.replace(",", ".")) <= 4.0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Grade card */}
      <Card className={`border-2 ${gradeBgColor(grade)}`}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <GraduationCap
                className={`h-16 w-16 ${gradeColor(grade)}`}
              />
              {passed && (
                <Trophy className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p
                className={`text-6xl font-bold ${gradeColor(grade)}`}
              >
                {grade}
              </p>
              <p
                className={`text-xl font-semibold mt-1 ${gradeColor(grade)}`}
              >
                {gradeLabel(grade)}
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-bold text-foreground text-lg">
                  {score}%
                </span>
                <p>Richtig</p>
              </div>
              <div className="border-l pl-6">
                <span className="font-bold text-foreground text-lg">
                  {earnedPoints}/{totalPoints}
                </span>
                <p>Punkte</p>
              </div>
              <div className="border-l pl-6">
                <span className="font-bold text-foreground text-lg">
                  {answers.filter((a) => a.is_correct).length}/
                  {questions.length}
                </span>
                <p>Fragen</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question review */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Auswertung</h2>
        {questions.map((q, i) => {
          const answer = answerMap.get(q.id);
          const isCorrect = answer?.is_correct ?? false;
          const selectedAnswer = answer?.selected_answer ?? "";

          return (
            <Card
              key={q.id}
              className={
                isCorrect
                  ? "border-green-200 dark:border-green-800"
                  : "border-red-200 dark:border-red-800"
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <CardTitle className="text-base">
                      {i + 1}. {q.question_text}
                    </CardTitle>
                  </div>
                  <Badge
                    variant={isCorrect ? "default" : "destructive"}
                    className="shrink-0"
                  >
                    {answer?.points_earned ?? 0}/{q.points} P.
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Show options for MC/TF */}
                {q.question_type !== "free_text" &&
                  q.options.length > 0 &&
                  q.options.map((opt) => {
                    const wasSelected = selectedAnswer === opt.label;
                    const isCorrectOption = opt.is_correct;
                    return (
                      <div
                        key={opt.label}
                        className={`flex items-center gap-2 p-2 rounded text-sm
                          ${
                            isCorrectOption
                              ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                              : wasSelected
                                ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                                : ""
                          }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                            ${
                              isCorrectOption
                                ? "bg-green-500 text-white"
                                : wasSelected
                                  ? "bg-red-500 text-white"
                                  : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {opt.label}
                        </span>
                        <span>{opt.text}</span>
                        {isCorrectOption && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                        {wasSelected && !isCorrectOption && (
                          <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                        )}
                      </div>
                    );
                  })}

                {/* Free text answer display */}
                {q.question_type === "free_text" && (
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">
                        Deine Antwort:{" "}
                      </span>
                      <span
                        className={
                          isCorrect ? "text-green-600" : "text-red-600"
                        }
                      >
                        {selectedAnswer || "(keine Antwort)"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        <span className="text-muted-foreground">
                          Richtige Antwort:{" "}
                        </span>
                        <span className="text-green-600 font-medium">
                          {q.correct_answer}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Explanation */}
                <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                  <span className="font-medium">Erklärung:</span>{" "}
                  {q.explanation}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Back button */}
      <div className="flex justify-center gap-4 pt-4">
        <Link href={`/dashboard/courses/${courseId}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu {courseName}
          </Button>
        </Link>
        <Link href={`/dashboard/courses/${courseId}/exam`}>
          <Button>
            <GraduationCap className="mr-2 h-4 w-4" />
            Neue Probeklausur
          </Button>
        </Link>
      </div>
    </div>
  );
}
