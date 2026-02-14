import { streamText, embed, convertToModelMessages } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel, getEmbeddingModel } from "@/lib/ai/provider";
import { checkFreemiumLimit, incrementUsage, getFreemiumErrorMessage } from "@/lib/freemium";
import { rateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { messages: uiMessages, courseId } = await req.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Nicht autorisiert", { status: 401 });
    }

    // Rate limit
    const rl = rateLimit(`${user.id}:chat`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
    if (!rl.success) {
      return new Response(
        JSON.stringify({ error: `Zu viele Anfragen. Bitte warte ${Math.ceil(rl.resetInMs / 1000)} Sekunden.` }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Freemium limit check
    const freemium = await checkFreemiumLimit(user.id);
    if (!freemium.allowed) {
      return new Response(
        JSON.stringify({ error: getFreemiumErrorMessage(freemium.used, freemium.limit) }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract text from the latest user message (UIMessage format with parts)
    const lastUserMsg = [...uiMessages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");

    if (!lastUserMsg) {
      return new Response("Keine Nachricht gefunden", { status: 400 });
    }

    // Extract text content from UIMessage parts array
    const userText =
      lastUserMsg.parts
        ?.filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join("") ||
      lastUserMsg.content ||
      "";

    // Support cross-course mode (global chat) when no courseId is provided
    let documentIds: string[] = [];
    let sourceInfo: { document_id: string; document_name: string; course_id: string; course_name: string }[] = [];

    if (courseId) {
      // Single course mode
      const { data: documentsData } = await supabase
        .from("documents")
        .select("id")
        .eq("course_id", courseId)
        .eq("status", "ready");
      const documents = documentsData as unknown as { id: string }[] | null;
      documentIds = documents?.map((d) => d.id) ?? [];
    } else {
      // Cross-course mode: get all user documents
      const { data: allDocs } = await supabase
        .from("documents")
        .select("id, title, course_id, courses!inner(name)")
        .eq("status", "ready");
      const docs = allDocs as unknown as { id: string; title: string; course_id: string; courses: { name: string } }[] | null;
      if (docs) {
        documentIds = docs.map((d) => d.id);
        sourceInfo = docs.map((d) => ({
          document_id: d.id,
          document_name: d.title,
          course_id: d.course_id,
          course_name: d.courses.name,
        }));
      }
    }

    let context = "";
    let matchedSources: { documentName: string; courseId: string; courseName: string }[] = [];

    if (documentIds.length > 0) {
      // Embed the user query
      const { embedding } = await embed({
        model: getEmbeddingModel(),
        value: userText,
      });

      // Search for relevant chunks
      const { data: chunks } = await (supabase.rpc as Function)("match_document_chunks", {
        query_embedding: JSON.stringify(embedding),
        match_count: 6,
        filter_document_ids: documentIds,
      });

      if (chunks && chunks.length > 0) {
        context = chunks
          .map((c: { content: string }) => c.content)
          .join("\n\n---\n\n");

        // Build source attribution for cross-course mode
        if (!courseId && sourceInfo.length > 0) {
          const chunkDocIds = new Set(chunks.map((c: { document_id: string }) => c.document_id));
          matchedSources = sourceInfo
            .filter((s) => chunkDocIds.has(s.document_id))
            .map((s) => ({ documentName: s.document_name, courseId: s.course_id, courseName: s.course_name }));
          // Deduplicate by document name
          const seen = new Set<string>();
          matchedSources = matchedSources.filter((s) => {
            if (seen.has(s.documentName)) return false;
            seen.add(s.documentName);
            return true;
          });
        }
      }
    }

    const sourceHint = matchedSources.length > 0
      ? `\n\nBei deiner Antwort, erwähne die Quelle am Ende im Format: "📄 Quelle: [Dokumentname]"`
      : "";

    const systemPrompt = `Du bist ein hilfreicher KI-Lernassistent für deutschsprachige Universitätsstudierende. Deine Aufgabe ist es, Fragen zu den Lernmaterialien des Studierenden zu beantworten.

WICHTIGE REGELN:
- Antworte IMMER auf Deutsch
- Basiere deine Antworten AUSSCHLIESSLICH auf dem bereitgestellten Kontext aus den Lernmaterialien
- Wenn die Antwort nicht im Kontext zu finden ist, sage ehrlich: "Diese Information ist in deinen Unterlagen nicht enthalten."
- Erkläre Konzepte klar und verständlich
- Verwende Beispiele aus dem Kontext wenn möglich
- Formatiere deine Antworten mit Markdown für bessere Lesbarkeit${sourceHint}

${context ? `KONTEXT AUS DEN LERNMATERIALIEN:\n${context}` : "Es sind keine Lernmaterialien vorhanden. Bitte den Studierenden, zuerst Dokumente hochzuladen."}`;

    // Save user message to DB (only for course-specific chat)
    if (courseId) {
      await supabase.from("chat_messages").insert({
        course_id: courseId,
        user_id: user.id,
        role: "user" as const,
        content: userText,
      } as never);
    }

    // Convert UIMessage[] to ModelMessage[] for streamText
    const modelMessages = await convertToModelMessages(uiMessages);

    // Increment AI usage counter before streaming (pre-validate)
    await incrementUsage(user.id);

    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        // Save assistant message to DB (only for course-specific chat)
        if (courseId) {
          await supabase.from("chat_messages").insert({
            course_id: courseId,
            user_id: user.id,
            role: "assistant" as const,
            content: text,
          } as never);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[Chat API Error]", error);
    return new Response(
      error instanceof Error ? error.message : "Interner Serverfehler",
      { status: 500 }
    );
  }
}
