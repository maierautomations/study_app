import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import { checkFreemiumLimit, incrementUsage, getFreemiumErrorMessage } from "@/lib/freemium";
import { rateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

const MemoryAidSchema = z.object({
  alternative_explanation: z.string(),
  example: z.string(),
  mnemonic: z.string(),
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
  const rl = rateLimit(`${user.id}:memory-aid`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
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
  const { flashcardId, front, back } = body;

  if (!flashcardId || !front || !back) {
    return NextResponse.json(
      { error: "flashcardId, front und back sind erforderlich" },
      { status: 400 }
    );
  }

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: MemoryAidSchema,
      prompt: `Du bist ein Experte für Lerntechniken und Mnemonik an deutschsprachigen Universitäten.

Ein Studierender hat Schwierigkeiten, sich folgende Flashcard zu merken:

FRAGE (Vorderseite): ${front}
ANTWORT (Rückseite): ${back}

Erstelle eine KI-Merkhilfe mit:

1. **alternative_explanation**: Eine alternative, einfachere Erklärung des Konzepts (2-3 Sätze). Nutze Analogien oder Alltagsbeispiele.

2. **example**: Ein konkretes Praxisbeispiel, das das Konzept veranschaulicht (2-3 Sätze).

3. **mnemonic**: Eine Eselsbrücke oder Merkhilfe (Akronym, Reim, Bildassoziation, Geschichte). Sei kreativ und einprägsam!

Alles auf Deutsch. Sei kreativ und nutze einprägsame Bilder/Analogien.`,
    });

    // Increment AI usage counter
    await incrementUsage(user.id);

    return NextResponse.json(object);
  } catch (err) {
    console.error("Memory aid error:", err);
    return NextResponse.json(
      { error: "Merkhilfe konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}
