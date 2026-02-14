import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import {
  checkFreemiumLimit,
  incrementUsage,
  getFreemiumErrorMessage,
} from "@/lib/freemium";
import { parseBody, studyPlanGenerateSchema } from "@/lib/validations";
import { rateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

const StudyPlanSchema = z.object({
  plan: z.array(
    z.object({
      day: z.number().describe("Day number (1 = today)"),
      date: z.string().describe("Date in format DD.MM.YYYY"),
      focus: z.string().describe("Main focus topic for this day"),
      tasks: z.array(
        z.object({
          type: z.enum(["read", "quiz", "flashcards", "review", "exam"]),
          description: z.string(),
          duration_minutes: z.number(),
          document: z.string().optional(),
        })
      ),
      total_minutes: z.number(),
    })
  ),
  summary: z.string().describe("Brief summary of the study plan strategy"),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Check profile tier — Pro only
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as unknown as { tier: string } | null;

  if (!profile || profile.tier !== "premium") {
    return NextResponse.json(
      {
        error:
          "Der Lernplan-Generator ist nur für Pro-Nutzer verfügbar. Upgrade jetzt für personalisierte Lernpläne!",
      },
      { status: 403 }
    );
  }

  // Rate limit
  const rl = rateLimit(`${user.id}:study-plan`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
  if (!rl.success) {
    return NextResponse.json(
      { error: `Zu viele Anfragen. Bitte warte ${Math.ceil(rl.resetInMs / 1000)} Sekunden.` },
      { status: 429 }
    );
  }

  // Freemium limit check
  const freemium = await checkFreemiumLimit(user.id);
  if (!freemium.allowed) {
    return NextResponse.json(
      { error: getFreemiumErrorMessage(freemium.used, freemium.limit) },
      { status: 402 }
    );
  }

  const body = await request.json();
  const parsed = parseBody(studyPlanGenerateSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { courseId, examDate, dailyMinutes } = parsed.data;

  // Verify course ownership
  const { data: courseRaw } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();
  const course = courseRaw as unknown as { id: string; name: string } | null;

  if (!course) {
    return NextResponse.json(
      { error: "Kurs nicht gefunden" },
      { status: 404 }
    );
  }

  // Get documents
  const { data: docsRaw } = await supabase
    .from("documents")
    .select("id, name")
    .eq("course_id", courseId)
    .eq("status", "ready");
  const docs =
    (docsRaw as unknown as Array<{ id: string; name: string }> | null) ?? [];

  // Get quiz attempts for weakness info
  const { data: attemptsRaw } = await supabase
    .from("quiz_attempts")
    .select("score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const attempts =
    (attemptsRaw as unknown as Array<{
      score: number;
      created_at: string;
    }> | null) ?? [];

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
      : 0;

  // Calculate days until exam
  const today = new Date();
  const exam = new Date(examDate);
  const daysUntilExam = Math.max(
    1,
    Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const studyMinutes = dailyMinutes || 120;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: StudyPlanSchema,
      prompt: `Du bist ein erfahrener Lernberater für deutschsprachige Universitätsstudierende.

Erstelle einen detaillierten Lernplan für die Prüfungsvorbereitung.

KONTEXT:
- Kurs: ${course.name}
- Prüfungsdatum: ${examDate} (in ${daysUntilExam} Tagen)
- Verfügbare Lernzeit pro Tag: ${studyMinutes} Minuten
- Bisheriger Durchschnitts-Score in Quizzes: ${avgScore}%
- Dokumente (Stoffumfang): ${docs.map((d) => d.name).join(", ") || "Keine Dokumente"}
- Anzahl Dokumente: ${docs.length}

REGELN:
- Erstelle einen Plan für JEDEN Tag bis zur Prüfung (max 30 Tage)
- Plane verschiedene Aktivitätstypen ein: read (Stoff lesen), quiz (Quiz machen), flashcards (Karteikarten lernen), review (Wiederholung), exam (Probeklausur)
- Verteile den Stoff gleichmäßig, intensiviere gegen Ende
- Plane am letzten Tag vor der Prüfung nur leichte Wiederholung
- Plane Probeklausuren in der letzten Woche ein
- Berücksichtige Spaced Repetition: Wiederhole Stoff in wachsenden Abständen
- Nutze die Dokument-Namen als "document" in den Tasks
- Passe den Plan an die verfügbare Zeit an
- Gib realistische Zeitschätzungen für jede Aufgabe
- Alles auf Deutsch
- Startdatum ist heute: ${today.toLocaleDateString("de-DE")}`,
    });

    await incrementUsage(user.id);

    return NextResponse.json({
      plan: object.plan,
      summary: object.summary,
      daysUntilExam,
      courseName: course.name,
    });
  } catch (err) {
    console.error("Study plan generation error:", err);
    return NextResponse.json(
      { error: "Lernplan konnte nicht generiert werden" },
      { status: 500 }
    );
  }
}
