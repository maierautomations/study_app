"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Layers,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";
import { trackActivity } from "@/lib/gamification-client";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { EditFlashcardDialog } from "@/components/flashcard/flashcard-editor";
import { QUALITY_LABELS, type ReviewQuality } from "@/lib/spaced-repetition";

type DueCard = {
  id: string;
  front: string;
  back: string;
  setId: string;
  setTitle: string;
  courseId: string;
  courseName: string;
  courseColor: string | null;
  lastInterval: number;
  lastEaseFactor: number;
  isNew: boolean;
};

const QUALITY_BUTTONS: {
  quality: ReviewQuality;
  label: string;
  variant: "destructive" | "outline" | "default" | "secondary";
  description: string;
}[] = [
  { quality: 1, label: QUALITY_LABELS[1], variant: "destructive", description: "Nicht gewusst" },
  { quality: 3, label: QUALITY_LABELS[3], variant: "outline", description: "Mit Mühe" },
  { quality: 4, label: QUALITY_LABELS[4], variant: "secondary", description: "Nach Nachdenken" },
  { quality: 5, label: QUALITY_LABELS[5], variant: "default", description: "Sofort gewusst" },
];

const MAX_CARDS_PER_SESSION = 20;

interface ReviewSessionProps {
  courseId: string;
  courseName: string;
  courseColor: string | null;
}

export function ReviewSession({
  courseId,
  courseName,
  courseColor,
}: ReviewSessionProps) {
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [againCards, setAgainCards] = useState<DueCard[]>([]);
  const [reversed, setReversed] = useState(false);
  const [showBatchBreak, setShowBatchBreak] = useState(false);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({ 1: 0, 3: 0, 4: 0, 5: 0 });

  useEffect(() => {
    async function fetchDueCards() {
      try {
        const res = await fetch(`/api/flashcards/due?courseId=${courseId}`);
        if (!res.ok) throw new Error("Failed to fetch due cards");
        const data = await res.json();
        // Limit to MAX_CARDS_PER_SESSION
        setCards(data.dueCards.slice(0, MAX_CARDS_PER_SESSION));
      } catch (err) {
        console.error("Error fetching due cards:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDueCards();
  }, [courseId]);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleRate = useCallback(
    async (quality: ReviewQuality) => {
      if (!currentCard || submitting) return;
      setSubmitting(true);

      try {
        // Submit review to API
        const res = await fetch("/api/flashcards/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flashcardId: currentCard.id,
            quality,
          }),
        });

        if (!res.ok) throw new Error("Review failed");

        // Track gamification
        const gamResult = await trackActivity(
          "flashcard_review",
          courseId,
          { quality, flashcard_id: currentCard.id }
        );
        if (gamResult) {
          setTotalXp((prev) => prev + gamResult.xp_earned);
        }

        setReviewedCount((prev) => prev + 1);
        setRatingCounts((prev) => ({ ...prev, [quality]: (prev[quality] ?? 0) + 1 }));

        // If "Nochmal", add card to again queue
        if (quality === 1) {
          setAgainCards((prev) => [...prev, currentCard]);
        }

        // Check for batch break every 10 cards
        const nextReviewed = reviewedCount + 1;
        if (nextReviewed % 10 === 0 && currentIndex < totalCards - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
          setShowBatchBreak(true);
          return;
        }

        // Move to next card
        if (currentIndex < totalCards - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        } else if (againCards.length > 0 || (quality === 1 ? 1 : 0) > 0) {
          // Show "again" cards after all main cards done
          const remaining = quality === 1
            ? [...againCards, currentCard]
            : [...againCards];
          if (remaining.length > 0) {
            setCards(remaining);
            setAgainCards([]);
            setCurrentIndex(0);
            setIsFlipped(false);
          } else {
            setSessionComplete(true);
          }
        } else {
          setSessionComplete(true);
        }
      } catch (err) {
        console.error("Review error:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [currentCard, submitting, courseId, currentIndex, totalCards, againCards, reviewedCount]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (sessionComplete || loading) return;

      if (!isFlipped) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleFlip();
        }
      } else {
        if (e.key === "1") handleRate(1);
        else if (e.key === "2") handleRate(3);
        else if (e.key === "3") handleRate(4);
        else if (e.key === "4") handleRate(5);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, sessionComplete, loading, handleFlip, handleRate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <Card className="border-dashed">
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Alles erledigt!</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            Es gibt keine fälligen Karten in diesem Kurs. Komm später wieder!
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/reviews">Zurück zu Wiederholungen</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // Session complete summary
  if (sessionComplete) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Session abgeschlossen!</h2>
          <p className="text-muted-foreground mb-6">{courseName}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold">{reviewedCount}</p>
              <p className="text-sm text-muted-foreground">Karten gelernt</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-3xl font-bold text-primary">+{totalXp}</p>
              <p className="text-sm text-muted-foreground">XP verdient</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6 text-xs">
            {QUALITY_BUTTONS.map((btn) => (
              <div key={btn.quality} className="p-2 rounded bg-muted text-center">
                <p className="font-medium">{ratingCounts[btn.quality] ?? 0}</p>
                <p className="text-muted-foreground">{btn.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/dashboard/reviews">Zurück</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Batch break screen every 10 cards
  if (showBatchBreak) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="p-8 text-center">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">Zwischenstand</h2>
          <p className="text-muted-foreground mb-4">{courseName}</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{reviewedCount}</p>
              <p className="text-xs text-muted-foreground">Karten gelernt</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{totalCards - currentIndex}</p>
              <p className="text-xs text-muted-foreground">Karten übrig</p>
            </div>
          </div>

          <Progress value={(reviewedCount / totalCards) * 100} className="h-2 mb-4" />

          <div className="grid grid-cols-4 gap-2 mb-6 text-xs">
            {QUALITY_BUTTONS.map((btn) => (
              <div key={btn.quality} className="p-2 rounded bg-muted text-center">
                <p className="font-medium">{ratingCounts[btn.quality] ?? 0}</p>
                <p className="text-muted-foreground">{btn.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setSessionComplete(true)}>
              Session beenden
            </Button>
            <Button onClick={() => setShowBatchBreak(false)}>
              Weiter lernen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {courseName}
          </h1>
          {courseColor && (
            <div
              className="h-1 w-16 rounded-full mt-1"
              style={{ backgroundColor: courseColor }}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            {currentIndex + 1} / {totalCards}
          </Badge>
          {currentCard?.isNew && (
            <Badge variant="secondary">Neu</Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      {/* Flashcard */}
      <div
        className="cursor-pointer"
        onClick={!isFlipped ? handleFlip : undefined}
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
            {currentCard && (
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
            )}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                {reversed ? "Antwort" : "Frage"}
              </p>
              {currentCard && (
                <MarkdownRenderer content={reversed ? currentCard.back : currentCard.front} className="text-xl" compact />
              )}
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
              {currentCard && (
                <MarkdownRenderer content={reversed ? currentCard.front : currentCard.back} className="text-lg" compact />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Rating buttons — only show when flipped */}
      {isFlipped && (
        <div className="space-y-3">
          <p className="text-sm text-center text-muted-foreground">
            Wie gut hast du die Antwort gewusst?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {QUALITY_BUTTONS.map((btn, idx) => (
              <Button
                key={btn.quality}
                variant={btn.variant}
                onClick={() => handleRate(btn.quality)}
                disabled={submitting}
                className="flex flex-col h-auto py-3"
              >
                <span className="font-medium">{btn.label}</span>
                <span className="text-[10px] opacity-70">{btn.description}</span>
                <span className="text-[10px] opacity-50 mt-0.5">({idx + 1})</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Again cards indicator */}
      {againCards.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{againCards.length} Karte(n) zur Wiederholung am Ende</span>
        </div>
      )}

      {/* Reversal toggle + Keyboard hint */}
      <div className="flex justify-center">
        <Button
          variant={reversed ? "secondary" : "ghost"}
          size="sm"
          className="text-xs"
          onClick={() => { setReversed((r) => !r); setIsFlipped(false); }}
        >
          <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
          {reversed ? "Normal lernen" : "Umgekehrt lernen"}
        </Button>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Tastatur: Leertaste = umdrehen, 1-4 = bewerten
      </p>
    </div>
  );
}
