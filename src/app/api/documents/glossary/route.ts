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

const GlossarySchema = z.object({
  terms: z.array(
    z.object({
      term: z.string().describe("The technical term / Fachbegriff"),
      definition: z
        .string()
        .describe("Clear definition in German, 1-3 sentences"),
      context: z
        .string()
        .describe("Brief context where this term appears in the material"),
    })
  ),
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

  // Verify document ownership
  const { data: docRaw } = await supabase
    .from("documents")
    .select("id, name, user_id, status, glossary")
    .eq("id", documentId)
    .single();
  const doc = docRaw as unknown as {
    id: string;
    name: string;
    user_id: string;
    status: string;
    glossary: string | null;
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

  // Return cached glossary if available
  if (doc.glossary) {
    return NextResponse.json({ glossary: JSON.parse(doc.glossary) });
  }

  // Get document chunks
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
    if (contextText.length + chunk.content.length > 12000) break;
    contextText += chunk.content + "\n\n";
  }

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: GlossarySchema,
      prompt: `Du bist ein Experte für das Extrahieren von Fachbegriffen aus akademischen Texten.

Analysiere das folgende Dokument "${doc.name}" und extrahiere alle wichtigen Fachbegriffe (15-30 Begriffe).

Anforderungen:
- term: Der Fachbegriff (deutsch oder in Originalsprache, falls üblich)
- definition: Klare Definition in 1-3 Sätzen auf Deutsch
- context: Kurzer Kontext, wo der Begriff im Material vorkommt (1 Satz)

Sortiere die Begriffe ALPHABETISCH.
Bevorzuge spezifische Fachbegriffe, nicht allgemeine Wörter.
Wenn ein Begriff in der Fachsprache auf Englisch üblich ist, behalte ihn auf Englisch.

DOKUMENT:
${contextText}`,
    });

    // Sort alphabetically
    object.terms.sort((a, b) =>
      a.term.toLowerCase().localeCompare(b.term.toLowerCase(), "de")
    );

    // Cache glossary in DB
    const glossaryJson = JSON.stringify(object.terms);
    await supabase
      .from("documents")
      .update({ glossary: glossaryJson } as never)
      .eq("id", documentId);

    // Increment usage
    await incrementUsage(user.id);

    return NextResponse.json({ glossary: object.terms });
  } catch (err) {
    console.error("Glossary generation error:", err);
    return NextResponse.json(
      { error: "Glossar konnte nicht generiert werden" },
      { status: 500 }
    );
  }
}
