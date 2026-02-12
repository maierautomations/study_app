import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroProps {
  isLoggedIn: boolean;
}

export function Hero({ isLoggedIn }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground mb-8 backdrop-blur">
          <Sparkles className="h-4 w-4 text-primary" />
          KI-gestützte Prüfungsvorbereitung
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          Bestehe jede Prüfung{" "}
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            — mit KI
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Lade deine Vorlesungsunterlagen hoch und erhalte sofort
          KI-generierte Quizfragen, Flashcards und einen Chat, der dir
          alles erklärt. Für deutschsprachige Studierende.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {isLoggedIn ? (
            <Button size="lg" asChild className="text-base px-8">
              <Link href="/dashboard">
                Zum Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/register">
                  Kostenlos starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="/login">
                  Anmelden
                </Link>
              </Button>
            </>
          )}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Keine Kreditkarte nötig · 20 KI-Generierungen/Monat gratis
        </p>
      </div>
    </section>
  );
}
