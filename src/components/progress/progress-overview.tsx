"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Flame,
  Zap,
  BookOpen,
  FileText,
  BrainCircuit,
  Layers,
  TrendingUp,
} from "lucide-react";
import type { Profile, StudySession, Course } from "@/types/database";

interface ProgressOverviewProps {
  profile: Profile | null;
  sessions: StudySession[];
  courses: Pick<Course, "id" | "name" | "color">[];
  stats: {
    totalQuizzes: number;
    totalFlashcardSets: number;
    totalDocuments: number;
    totalAchievements: number;
    unlockedAchievements: number;
  };
}

// Build heatmap data for last 365 days
function buildHeatmapData(sessions: StudySession[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const session of sessions) {
    const day = session.created_at.split("T")[0];
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
}

// Build XP timeline (last 30 days)
function buildXpTimeline(sessions: StudySession[]): { date: string; xp: number }[] {
  const now = new Date();
  const days: { date: string; xp: number }[] = [];
  const xpByDay = new Map<string, number>();

  for (const session of sessions) {
    const day = session.created_at.split("T")[0];
    xpByDay.set(day, (xpByDay.get(day) ?? 0) + session.xp_earned);
  }

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, xp: xpByDay.get(key) ?? 0 });
  }
  return days;
}

// Build course activity counts
function buildCourseActivity(sessions: StudySession[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const session of sessions) {
    if (session.course_id) {
      map.set(session.course_id, (map.get(session.course_id) ?? 0) + 1);
    }
  }
  return map;
}

// Heatmap constants
const CELL_SIZE = 12;
const CELL_GAP = 2;
const WEEKS = 52;
const DAYS_LABEL = ["", "Mo", "", "Mi", "", "Fr", ""];

function getHeatmapColor(count: number): string {
  if (count === 0) return "var(--muted)";
  if (count <= 2) return "oklch(0.72 0.15 145)"; // light green
  if (count <= 5) return "oklch(0.58 0.18 145)"; // medium green
  if (count <= 10) return "oklch(0.45 0.2 145)"; // dark green
  return "oklch(0.35 0.22 145)"; // very dark green
}

export function ProgressOverview({
  profile,
  sessions,
  courses,
  stats,
}: ProgressOverviewProps) {
  const heatmapData = useMemo(() => buildHeatmapData(sessions), [sessions]);
  const xpTimeline = useMemo(() => buildXpTimeline(sessions), [sessions]);
  const courseActivity = useMemo(() => buildCourseActivity(sessions), [sessions]);

  const totalXp = profile?.xp ?? 0;
  const currentStreak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;
  const level = profile?.level ?? 1;

  const totalSessions = sessions.length;
  const totalXpEarned = sessions.reduce((sum, s) => sum + s.xp_earned, 0);

  // Active days in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentActiveDays = new Set(
    sessions
      .filter((s) => new Date(s.created_at) >= thirtyDaysAgo)
      .map((s) => s.created_at.split("T")[0])
  ).size;

  // Heatmap: build grid (52 weeks x 7 days)
  const heatmapCells = useMemo(() => {
    const cells: { x: number; y: number; date: string; count: number }[] = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - WEEKS * 7 + 1);
    // Align to the start of the week (Monday)
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    for (let week = 0; week < WEEKS; week++) {
      for (let day = 0; day < 7; day++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + week * 7 + day);
        if (d > now) continue;
        const key = d.toISOString().split("T")[0];
        cells.push({
          x: week * (CELL_SIZE + CELL_GAP),
          y: day * (CELL_SIZE + CELL_GAP),
          date: key,
          count: heatmapData.get(key) ?? 0,
        });
      }
    }
    return cells;
  }, [heatmapData]);

  // XP chart: simple bar chart
  const maxXp = Math.max(...xpTimeline.map((d) => d.xp), 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fortschrittsübersicht</h1>
        <p className="text-muted-foreground">
          Dein gesamter Lernfortschritt auf einen Blick.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalXp}</p>
                <p className="text-xs text-muted-foreground">Gesamt-XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">Aktuelle Serie (Rekord: {longestStreak})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Stufe {level}</p>
                <p className="text-xs text-muted-foreground">{recentActiveDays} aktive Tage (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.unlockedAchievements}/{stats.totalAchievements}
                </p>
                <p className="text-xs text-muted-foreground">Erfolge freigeschaltet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{stats.totalDocuments}</p>
              <p className="text-xs text-muted-foreground">Dokumente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BrainCircuit className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{stats.totalQuizzes}</p>
              <p className="text-xs text-muted-foreground">Quizzes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{stats.totalFlashcardSets}</p>
              <p className="text-xs text-muted-foreground">Flashcard-Sets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lernaktivität (letzte 12 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-2">
              {/* Day labels */}
              <div className="flex flex-col shrink-0" style={{ gap: CELL_GAP }}>
                {DAYS_LABEL.map((label, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-muted-foreground flex items-center justify-end"
                    style={{ height: CELL_SIZE, width: 20 }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              {/* Heatmap SVG */}
              <svg
                width={WEEKS * (CELL_SIZE + CELL_GAP)}
                height={7 * (CELL_SIZE + CELL_GAP)}
                className="block"
              >
                {heatmapCells.map((cell) => (
                  <rect
                    key={cell.date}
                    x={cell.x}
                    y={cell.y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    fill={getHeatmapColor(cell.count)}
                    className="transition-colors"
                  >
                    <title>
                      {new Date(cell.date).toLocaleDateString("de-DE")}: {cell.count} Aktivität{cell.count !== 1 ? "en" : ""}
                    </title>
                  </rect>
                ))}
              </svg>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-1 mt-3 text-[10px] text-muted-foreground">
              <span>Weniger</span>
              {[0, 2, 5, 10, 15].map((n) => (
                <div
                  key={n}
                  className="rounded-sm"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: getHeatmapColor(n),
                  }}
                />
              ))}
              <span>Mehr</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP Chart (last 30 days) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">XP-Verlauf (letzte 30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-32">
            {xpTimeline.map((day) => {
              const height = maxXp > 0 ? (day.xp / maxXp) * 100 : 0;
              return (
                <div
                  key={day.date}
                  className="flex-1 min-w-0 rounded-t-sm bg-primary/70 hover:bg-primary transition-colors relative group"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground rounded-md px-2 py-1 text-[10px] shadow-md whitespace-nowrap border">
                      {new Date(day.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}: {day.xp} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{new Date(xpTimeline[0]?.date ?? "").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span>
            <span>Gesamt: {xpTimeline.reduce((s, d) => s + d.xp, 0)} XP in 30 Tagen</span>
            <span>{new Date(xpTimeline[xpTimeline.length - 1]?.date ?? "").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Course comparison */}
      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Aktivität pro Kurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courses.map((course) => {
                const activity = courseActivity.get(course.id) ?? 0;
                const maxActivity = Math.max(...courses.map((c) => courseActivity.get(c.id) ?? 0), 1);
                const pct = (activity / maxActivity) * 100;
                return (
                  <div key={course.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: course.color ?? "#3b82f6" }}
                        />
                        <span className="font-medium truncate">{course.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {activity} Aktivität{activity !== 1 ? "en" : ""}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: course.color ?? "#3b82f6",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
