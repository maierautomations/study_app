import {
  FileText,
  BrainCircuit,
  MessageSquare,
  Layers,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Dokumente hochladen",
    description:
      "PDF, DOCX oder TXT — lade deine Vorlesungsunterlagen hoch und die KI verarbeitet sie automatisch.",
  },
  {
    icon: BrainCircuit,
    title: "KI-Quiz-Generierung",
    description:
      "Multiple Choice, Wahr/Falsch und offene Fragen — mit sofortigem Feedback und Erklärungen.",
  },
  {
    icon: Layers,
    title: "Flashcards erstellen",
    description:
      "KI-generierte Karteikarten aus deinen Unterlagen. Lerne effizient mit Flip-Animationen.",
  },
  {
    icon: MessageSquare,
    title: "RAG-Chat",
    description:
      "Stelle Fragen zu deinen Dokumenten und erhalte präzise Antworten — basierend auf deinem Material.",
  },
  {
    icon: RotateCcw,
    title: "Spaced Repetition",
    description:
      "SM-2 Algorithmus plant deine Wiederholungen optimal. Lerne weniger, behalte mehr.",
  },
  {
    icon: TrendingUp,
    title: "Fortschritt & Gamification",
    description:
      "XP, Level, Streaks und Achievements motivieren dich. Schwächenanalyse zeigt, wo du üben musst.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-primary mb-2">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Alles was du zum Lernen brauchst
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stundenlang Karteikarten schreiben? Das war gestern. StudyApp
            generiert alles automatisch aus deinen Unterlagen.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border bg-background/80 hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
