"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Loader2,
  Lock,
  Clock,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PlanView } from "@/components/study-plan/plan-view";

type Course = { id: string; name: string };
type PlanDay = {
  day: number;
  date: string;
  focus: string;
  tasks: {
    type: "read" | "quiz" | "flashcards" | "review" | "exam";
    description: string;
    duration_minutes: number;
    document?: string;
  }[];
  total_minutes: number;
};

export default function StudyPlanPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("120");
  const [isGenerating, setIsGenerating] = useState(false);

  const [plan, setPlan] = useState<PlanDay[] | null>(null);
  const [planSummary, setPlanSummary] = useState("");
  const [planCourseName, setPlanCourseName] = useState("");
  const [planDaysUntilExam, setPlanDaysUntilExam] = useState(0);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileRaw } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", user.id)
        .single();
      const profile = profileRaw as unknown as { tier: string } | null;
      setIsPro(profile?.tier === "premium");

      const { data: coursesRaw } = await supabase
        .from("courses")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");
      setCourses(
        (coursesRaw as unknown as Course[] | null) ?? []
      );
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleGenerate() {
    if (!selectedCourse || !examDate) {
      toast.error("Bitte wähle einen Kurs und ein Prüfungsdatum.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/study-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          examDate,
          dailyMinutes: parseInt(dailyMinutes),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Nur für Pro-Nutzer", { description: data.error });
        } else if (res.status === 402) {
          toast.error("KI-Limit erreicht", { description: data.error });
        } else {
          toast.error(data.error || "Lernplan konnte nicht erstellt werden");
        }
        return;
      }

      setPlan(data.plan);
      setPlanSummary(data.summary);
      setPlanCourseName(data.courseName);
      setPlanDaysUntilExam(data.daysUntilExam);
    } catch {
      toast.error("Fehler bei der Lernplan-Generierung");
    } finally {
      setIsGenerating(false);
    }
  }

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lernplan</h1>
          <p className="text-muted-foreground">
            Erstelle einen personalisierten Lernplan für deine Prüfung
          </p>
        </div>
      </div>

      {!isPro ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Pro-Feature</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Der Lernplan-Generator ist nur für Pro-Nutzer verfügbar.
              Upgrade jetzt für personalisierte Tag-für-Tag Lernpläne,
              die sich an deine Stärken und Schwächen anpassen.
            </p>
          </CardContent>
        </Card>
      ) : plan ? (
        <>
          <Button variant="outline" onClick={() => setPlan(null)}>
            Neuen Lernplan erstellen
          </Button>
          <PlanView
            plan={plan}
            summary={planSummary}
            courseName={planCourseName}
            daysUntilExam={planDaysUntilExam}
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Lernplan konfigurieren
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kurs</label>
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kurs auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prüfungsdatum</label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  min={minDate}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Lernzeit pro Tag
                </label>
                <Select
                  value={dailyMinutes}
                  onValueChange={setDailyMinutes}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 1 Stunde
                      </span>
                    </SelectItem>
                    <SelectItem value="90">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 1,5 Stunden
                      </span>
                    </SelectItem>
                    <SelectItem value="120">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 2 Stunden
                      </span>
                    </SelectItem>
                    <SelectItem value="180">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 3 Stunden
                      </span>
                    </SelectItem>
                    <SelectItem value="240">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 4 Stunden
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p>
                Der KI-Lernplan berücksichtigt deine bisherigen
                Quiz-Ergebnisse, verteilt den Stoff gleichmäßig und plant
                Spaced Repetition + Probeklausuren ein.
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedCourse || !examDate}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Lernplan wird erstellt...
                </>
              ) : (
                <>
                  <CalendarDays className="mr-2 h-5 w-5" />
                  Lernplan generieren
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
