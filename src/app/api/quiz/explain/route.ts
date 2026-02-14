import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkFreemiumLimit, incrementUsage, getFreemiumErrorMessage } from "@/lib/freemium";
import { rateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { questionText, correctAnswer, selectedAnswer, explanation, courseId } = await req.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Nicht autorisiert", { status: 401 });
    }

    const rl = rateLimit(`${user.id}:explain`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
    if (!rl.success) {
      return Response.json(
        { error: `Zu viele Anfragen. Bitte warte ${Math.ceil(rl.resetInMs / 1000)} Sekunden.` },
        { status: 429 }
      );
    }

    const freemium = await checkFreemiumLimit(user.id);
    if (!freemium.allowed) {
      return Response.json(
        { error: getFreemiumErrorMessage(freemium.used, freemium.limit) },
        { status: 402 }
      );
    }

    await incrementUsage(user.id);

    const prompt = `Du bist ein KI-Lernassistent für deutschsprachige Studierende.

Ein Studierender hat bei einem Quiz die folgende Frage falsch beantwortet:

**Frage:** ${questionText}
**Gewählte Antwort:** ${selectedAnswer}
**Richtige Antwort:** ${correctAnswer}
${explanation ? `**Kurze Erklärung:** ${explanation}` : ""}

Erstelle eine ausführliche Erklärung auf Deutsch mit folgender Struktur:

1. **Warum die richtige Antwort richtig ist** — erkläre das Konzept dahinter
2. **Warum die gewählte Antwort falsch ist** — erkläre den Unterschied
3. **Praxisbeispiel oder Analogie** — zum besseren Verständnis
4. **Merkhilfe** — ein kurzer Merksatz oder Eselsbrücke

Formatiere deine Antwort mit Markdown. Sei klar und verständlich.`;

    const result = await generateText({
      model: getModel(),
      prompt,
    });

    return Response.json({ explanation: result.text });
  } catch (error) {
    console.error("[Quiz Explain Error]", error);
    return new Response("Interner Serverfehler", { status: 500 });
  }
}
