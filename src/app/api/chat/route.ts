import { streamText, embed } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel, getEmbeddingModel } from "@/lib/ai/provider";

export async function POST(req: Request) {
  const { messages, courseId } = await req.json();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Nicht autorisiert", { status: 401 });
  }

  if (!courseId) {
    return new Response("courseId ist erforderlich", { status: 400 });
  }

  // Get the latest user message for RAG retrieval
  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");

  if (!lastUserMessage) {
    return new Response("Keine Nachricht gefunden", { status: 400 });
  }

  // Get document IDs for this course
  const { data: documents } = await supabase
    .from("documents")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "ready");

  const documentIds = documents?.map((d) => d.id) ?? [];

  let context = "";

  if (documentIds.length > 0) {
    // Embed the user query
    const { embedding } = await embed({
      model: getEmbeddingModel(),
      value: lastUserMessage.content,
    });

    // Search for relevant chunks
    const { data: chunks } = await supabase.rpc("match_document_chunks", {
      query_embedding: JSON.stringify(embedding),
      match_count: 6,
      filter_document_ids: documentIds,
    });

    if (chunks && chunks.length > 0) {
      context = chunks.map((c: { content: string }) => c.content).join("\n\n---\n\n");
    }
  }

  const systemPrompt = `Du bist ein hilfreicher KI-Lernassistent für deutschsprachige Universitätsstudierende. Deine Aufgabe ist es, Fragen zu den Lernmaterialien des Studierenden zu beantworten.

WICHTIGE REGELN:
- Antworte IMMER auf Deutsch
- Basiere deine Antworten AUSSCHLIESSLICH auf dem bereitgestellten Kontext aus den Lernmaterialien
- Wenn die Antwort nicht im Kontext zu finden ist, sage ehrlich: "Diese Information ist in deinen Unterlagen nicht enthalten."
- Erkläre Konzepte klar und verständlich
- Verwende Beispiele aus dem Kontext wenn möglich
- Formatiere deine Antworten mit Markdown für bessere Lesbarkeit

${context ? `KONTEXT AUS DEN LERNMATERIALIEN:
${context}` : "Es sind keine Lernmaterialien für diesen Kurs vorhanden. Bitte den Studierenden, zuerst Dokumente hochzuladen."}`;

  // Save user message to DB
  await supabase.from("chat_messages").insert({
    course_id: courseId,
    user_id: user.id,
    role: "user",
    content: lastUserMessage.content,
  });

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages,
    onFinish: async ({ text }) => {
      // Save assistant message to DB
      await supabase.from("chat_messages").insert({
        course_id: courseId,
        user_id: user.id,
        role: "assistant",
        content: text,
      });

      // Increment AI usage counter
      const { data: profile } = await supabase
        .from("profiles")
        .select("ai_generations_used")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            ai_generations_used: profile.ai_generations_used + 1,
          })
          .eq("id", user.id);
      }
    },
  });

  return result.toDataStreamResponse();
}
