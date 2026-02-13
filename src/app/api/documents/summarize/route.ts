import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { AI_CONTEXT_LIMITS } from "@/lib/ai/config";
import { generateObject } from "ai";
import { z } from "zod";
import {
  checkFreemiumLimit,
  incrementUsage,
  getFreemiumErrorMessage,
} from "@/lib/freemium";

const SummarySchema = z.object({
  title: z.string().describe("A concise title for the document summary"),
  keyPoints: z
    .array(z.string())
    .describe("3-7 key points / core statements from the document"),
  keywords: z
    .array(z.string())
    .describe("5-10 important technical terms / keywords"),
  summary: z
    .string()
    .describe("A comprehensive summary of the document in about 200-300 words"),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Freemium limit check
  const freemium = await checkFreemiumLimit(user.id);
  if (!freemium.allowed) {
    return NextResponse.json(
      { error: getFreemiumErrorMessage(freemium.used, freemium.limit) },
      { status: 402 }
    );
  }

  const { documentId } = await request.json();

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId ist erforderlich" },
      { status: 400 }
    );
  }

  // Verify document ownership and get existing summary
  const { data: docRaw } = await supabase
    .from("documents")
    .select("id, name, summary, course_id, user_id, status")
    .eq("id", documentId)
    .single();
  const doc = docRaw as unknown as {
    id: string;
    name: string;
    summary: string | null;
    course_id: string;
    user_id: string;
    status: string;
  } | null;

  if (!doc || doc.user_id !== user.id) {
    return NextResponse.json(
      { error: "Dokument nicht gefunden" },
      { status: 404 }
    );
  }

  if (doc.status !== "ready") {
    return NextResponse.json(
      { error: "Dokument ist noch nicht verarbeitet" },
      { status: 400 }
    );
  }

  // Return cached summary if available
  if (doc.summary) {
    return NextResponse.json({ summary: JSON.parse(doc.summary) });
  }

  // Get document chunks for context
  const { data: chunksRaw } = await supabase
    .from("document_chunks")
    .select("content")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true });
  const chunks =
    (chunksRaw as unknown as Array<{ content: string }> | null) ?? [];

  if (chunks.length === 0) {
    return NextResponse.json(
      { error: "Keine Inhalte für dieses Dokument gefunden" },
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
      schema: SummarySchema,
      prompt: `Du bist ein Experte für das Zusammenfassen akademischer Texte auf Deutsch.

Erstelle eine strukturierte Zusammenfassung des folgenden Dokuments "${doc.name}".

Anforderungen:
- title: Ein kurzer, prägnanter Titel für die Zusammenfassung
- keyPoints: 3-7 Kernaussagen als Stichpunkte
- keywords: 5-10 wichtige Fachbegriffe/Schlüsselwörter
- summary: Eine umfassende Zusammenfassung in 200-300 Wörtern

Alles auf Deutsch. Fachbegriffe dürfen in der Originalsprache stehen.

DOKUMENT:
${contextText}`,
    });

    // Cache the summary in the database
    const summaryJson = JSON.stringify(object);
    await supabase
      .from("documents")
      .update({ summary: summaryJson } as never)
      .eq("id", documentId);

    // Increment AI usage counter
    await incrementUsage(user.id);

    return NextResponse.json({ summary: object });
  } catch (err) {
    console.error("Summary generation error:", err);
    return NextResponse.json(
      { error: "Zusammenfassung konnte nicht generiert werden" },
      { status: 500 }
    );
  }
}
