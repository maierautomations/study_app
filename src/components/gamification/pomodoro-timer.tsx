"use client";

import { useEffect, useRef, useCallback } from "react";
import { Timer, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePomodoroStore } from "@/lib/stores/pomodoro-store";
import { trackActivity } from "@/lib/gamification-client";
import { toast } from "sonner";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PomodoroTimer() {
  const {
    isRunning,
    isPaused,
    secondsLeft,
    completedSessions,
    start,
    pause,
    resume,
    reset,
    tick,
    completeSession,
  } = usePomodoroStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleComplete = useCallback(async () => {
    completeSession();
    toast.success("Pomodoro abgeschlossen!", {
      description: "+15 XP verdient. Gute Arbeit!",
    });
    await trackActivity("pomodoro_complete");
  }, [completeSession]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, tick]);

  // Check for completion
  useEffect(() => {
    if (isRunning && secondsLeft <= 0) {
      handleComplete();
    }
  }, [isRunning, secondsLeft, handleComplete]);

  const progress = isRunning
    ? ((25 * 60 - secondsLeft) / (25 * 60)) * 100
    : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 h-8 px-2 ${isRunning ? "text-primary" : "text-muted-foreground"}`}
          aria-label="Pomodoro-Timer"
        >
          <Timer className="h-4 w-4" />
          {isRunning && (
            <span className="text-xs font-mono tabular-nums">
              {formatTime(secondsLeft)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Pomodoro-Timer</h4>
            {completedSessions > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedSessions} Session{completedSessions !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Timer display */}
          <div className="flex flex-col items-center gap-3">
            {/* Circular progress */}
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-mono font-bold tabular-nums">
                  {formatTime(secondsLeft)}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <Button size="sm" onClick={start} className="gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  Starten
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isPaused ? resume : pause}
                    className="gap-1.5"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Weiter
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={reset}
                    aria-label="Timer abbrechen"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            25 Minuten fokussiert lernen. +15 XP pro Session.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
