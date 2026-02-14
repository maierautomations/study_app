import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { AI_CONTEXT_LIMITS } from "@/lib/ai/config";
import { generateObject } from "ai";
import { z } from "zod";
import { checkFreemiumLimit, incrementUsage, getFreemiumErrorMessage } from "@/lib/freemium";
import { rateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

const KnowledgeCheckSchema = z.object({
  questions: z.array(
    z.object({
      question_text: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      options: z.array(
        z.object({
          label: z.string(),
          text: z.string(),
          is_correct: z.boolean(),
        })
      ),
      correct_answer: z.string(),
      explanation: z.string(),
    })
  ),
  assessment: z.object({
    level: z.enum(["beginner", "intermediate", "advanced"]),
    level_de: z.string(),
    summary: z.string(),
    recommendations: z.array(z.string()),
  }),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Rate limit
  const rl = rateLimit(`${user.id}:knowledge-check`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
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
  const courseId = body.courseId;

  if (!courseId) {
    return NextResponse.json({ error: "courseId erforderlich" }, { status: 400 });
  }

  // Verify course ownership
  const { data: courseRaw } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();
  const course = courseRaw as unknown as { id: string; name: string } | null;

  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  // Get document chunks
  const { data: docIdsRaw } = await supabase
    .from("documents")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "ready");
  const docIds = (docIdsRaw as unknown as Array<{ id: string }> | null) ?? [];

  if (docIds.length === 0) {
    return NextResponse.json(
      { error: "Keine verarbeiteten Dokumente im Kurs" },
      { status: 400 }
    );
  }

  const { data: chunksRaw } = await supabase
    .from("document_chunks")
    .select("content")
    .in("document_id", docIds.map((d) => d.id))
    .order("chunk_index", { ascending: true });
  const chunks = chunksRaw as unknown as Array<{ content: string }> | null;

  if (!chunks || chunks.length === 0) {
    return NextResponse.json(
      { error: "Keine Inhalte gefunden" },
      { status: 400 }
    );
  }

  let contextText = "";
  for (const chunk of chunks) {
    if (contextText.length + chunk.content.length > AI_CONTEXT_LIMITS.default) break;
    contextText += chunk.content + "\n\n";
  }

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: KnowledgeCheckSchema,
      prompt: `Du bist ein Experte für Lernstandsdiagnose an deutschsprachigen Universitäten.

Erstelle einen Wissensstand-Check für den Kurs "${course.name}" mit genau 5 Multiple-Choice-Fragen.

Die Fragen sollen den Schwierigkeitsgrad ansteigend haben:
1. Frage 1-2: Leicht (Grundbegriffe, Definitionen)
2. Frage 3-4: Mittel (Verständnis, Zusammenhänge)
3. Frage 5: Schwer (Analyse, Transfer)

Für jede Frage:
- 4 Antwortoptionen (A, B, C, D), genau eine richtig
- Kurze Erklärung auf Deutsch

Nach den Fragen: Erstelle eine Einschätzung des Wissensstands:
- "beginner" wenn hauptsächlich leichte Fragen richtig
- "intermediate" wenn mittlere Fragen auch richtig
- "advanced" wenn auch schwere Fragen richtig

Die Einschätzung enthält:
- level_de: "Einsteiger", "Fortgeschritten", oder "Experte"
- summary: 1-2 Sätze Zusammenfassung auf Deutsch
- recommendations: 2-3 konkrete Lernempfehlungen auf Deutsch

LERNMATERIAL:
${contextText}`,
    });

    // Increment AI usage counter
    await incrementUsage(user.id);

    return NextResponse.json(object);
  } catch (err) {
    console.error("Knowledge check error:", err);
    return NextResponse.json(
      { error: "Wissensstand-Check fehlgeschlagen" },
      { status: 500 }
    );
  }
}
