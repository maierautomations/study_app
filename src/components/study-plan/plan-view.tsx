"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  BrainCircuit,
  Layers,
  RefreshCw,
  GraduationCap,
  Clock,
  CheckCircle2,
} from "lucide-react";

type TaskType = "read" | "quiz" | "flashcards" | "review" | "exam";

type PlanTask = {
  type: TaskType;
  description: string;
  duration_minutes: number;
  document?: string;
};

type PlanDay = {
  day: number;
  date: string;
  focus: string;
  tasks: PlanTask[];
  total_minutes: number;
};

interface PlanViewProps {
  plan: PlanDay[];
  summary: string;
  courseName: string;
  daysUntilExam: number;
}

const taskIcons: Record<TaskType, typeof BookOpen> = {
  read: BookOpen,
  quiz: BrainCircuit,
  flashcards: Layers,
  review: RefreshCw,
  exam: GraduationCap,
};

const taskLabels: Record<TaskType, string> = {
  read: "Lesen",
  quiz: "Quiz",
  flashcards: "Karteikarten",
  review: "Wiederholung",
  exam: "Probeklausur",
};

const taskColors: Record<TaskType, string> = {
  read: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  quiz: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  flashcards: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  exam: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function PlanView({
  plan,
  summary,
  courseName,
  daysUntilExam,
}: PlanViewProps) {
  const today = new Date();
  const todayStr = today.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">{courseName}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary}</p>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {daysUntilExam} Tage bis zur Prüfung
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {plan.length} Lerntage geplant
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day-by-day plan */}
      <div className="space-y-3">
        {plan.map((day) => {
          const isToday = day.date === todayStr;
          const dayDate = day.date;

          return (
            <Card
              key={day.day}
              className={isToday ? "border-primary ring-1 ring-primary/20" : ""}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {isToday && (
                      <Badge variant="default" className="text-[10px]">
                        Heute
                      </Badge>
                    )}
                    <span>Tag {day.day}</span>
                    <span className="text-muted-foreground font-normal">
                      {dayDate}
                    </span>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {day.total_minutes} min
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{day.focus}</p>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {day.tasks.map((task, i) => {
                  const Icon = taskIcons[task.type] ?? BookOpen;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium shrink-0 ${taskColors[task.type] ?? ""}`}
                      >
                        <Icon className="h-3 w-3" />
                        {taskLabels[task.type] ?? task.type}
                      </div>
                      <span className="text-muted-foreground flex-1">
                        {task.description}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {task.duration_minutes} min
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
