"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Shuffle,
  CheckCircle2,
  Loader2,
  ArrowLeftRight,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { EditFlashcardDialog } from "@/components/flashcard/flashcard-editor";
import type { FlashcardSet, Flashcard } from "@/types/database";

export default function FlashcardLearnPage() {
  const { courseId, setId } = useParams<{
    courseId: string;
    setId: string;
  }>();
  const supabase = createClient();

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [reversed, setReversed] = useState(false);

  useEffect(() => {
    async function fetchCards() {
      const [{ data: setDataRaw }, { data: cardsDataRaw }] = await Promise.all([
        supabase.from("flashcard_sets").select("*").eq("id", setId).single(),
        supabase
          .from("flashcards")
          .select("*")
          .eq("set_id", setId)
          .order("order_index", { ascending: true }),
      ]);
      const setData = setDataRaw as unknown as FlashcardSet | null;
      const cardsData = cardsDataRaw as unknown as Flashcard[] | null;

      if (setData) setSet(setData);
      if (cardsData) setCards(cardsData);
      setLoading(false);
    }
    fetchCards();
  }, [setId, supabase]);

  const currentCard = cards[currentIndex];
  const progress = cards.length
    ? ((currentIndex + 1) / cards.length) * 100
    : 0;

  function handleFlip() {
    setIsFlipped((prev) => !prev);
  }

  function handleNext() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }

  function handleMarkKnown() {
    if (currentCard) {
      setKnownCards((prev) => {
        const next = new Set(prev);
        if (next.has(currentCard.id)) {
          next.delete(currentCard.id);
        } else {
          next.add(currentCard.id);
        }
        return next;
      });
    }
  }

  function handleShuffle() {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleFlip();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "ArrowLeft") {
      handlePrev();
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!set || cards.length === 0) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Flashcard-Set nicht gefunden.</p>
        <Button asChild className="mt-4">
          <Link href={`/dashboard/courses/${courseId}`}>Zurück zum Kurs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 max-w-2xl mx-auto outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/courses/${courseId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück zum Kurs
        </Link>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {cards.length} &middot; {knownCards.size} gewusst
        </span>
      </div>

      <div>
        <h1 className="text-xl font-bold">{set.title}</h1>
        <Progress value={progress} className="mt-2 h-2" />
      </div>

      {/* Flashcard with flip animation */}
      <div
        className="perspective-1000 cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "280px",
          }}
        >
          {/* Front */}
          <Card
            className="absolute inset-0 flex items-center justify-center p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
              <EditFlashcardDialog
                flashcardId={currentCard.id}
                initialFront={currentCard.front}
                initialBack={currentCard.back}
                onSaved={(front, back) => {
                  setCards((prev) =>
                    prev.map((c) =>
                      c.id === currentCard.id ? { ...c, front, back } : c
                    )
                  );
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                {reversed ? "Antwort" : "Frage"}
              </p>
              <MarkdownRenderer content={reversed ? currentCard.back : currentCard.front} className="text-xl" compact />
              <p className="text-xs text-muted-foreground mt-6">
                Klicken oder Leertaste zum Umdrehen
              </p>
            </div>
          </Card>

          {/* Back */}
          <Card
            className="absolute inset-0 flex items-center justify-center p-8"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                {reversed ? "Frage" : "Antwort"}
              </p>
              <MarkdownRenderer content={reversed ? currentCard.front : currentCard.back} className="text-lg" compact />
            </div>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant={
              currentCard && knownCards.has(currentCard.id)
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={handleMarkKnown}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {currentCard && knownCards.has(currentCard.id)
              ? "Gewusst"
              : "Als gewusst markieren"}
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant={reversed ? "secondary" : "ghost"}
          size="sm"
          onClick={() => { setReversed((r) => !r); setIsFlipped(false); }}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {reversed ? "Normal lernen" : "Umgekehrt lernen"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShuffle}>
          <Shuffle className="mr-2 h-4 w-4" />
          Mischen
        </Button>
        <Button variant="ghost" size="sm" onClick={handleRestart}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Neustart
        </Button>
      </div>

      {/* Completion state */}
      {currentIndex === cards.length - 1 && isFlipped && (
        <Card className="p-6 text-center">
          <p className="font-medium mb-2">
            Du hast alle {cards.length} Karten durchgearbeitet!
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {knownCards.size} von {cards.length} gewusst (
            {Math.round((knownCards.size / cards.length) * 100)}%)
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nochmal
            </Button>
            <Button asChild>
              <Link href={`/dashboard/courses/${courseId}`}>
                Zurück zum Kurs
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
