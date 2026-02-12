import { Upload, Sparkles, BookOpen, Trophy } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "1",
    title: "Hochladen",
    description:
      "Lade deine Vorlesungsfolien, Skripte oder Zusammenfassungen als PDF, DOCX oder TXT hoch.",
  },
  {
    icon: Sparkles,
    number: "2",
    title: "Generieren",
    description:
      "Die KI erstellt automatisch Quizfragen, Flashcards und Zusammenfassungen aus deinem Material.",
  },
  {
    icon: BookOpen,
    number: "3",
    title: "Lernen",
    description:
      "Lerne mit interaktiven Quizzes, wiederhole Flashcards mit Spaced Repetition und chatte mit deinen Unterlagen.",
  },
  {
    icon: Trophy,
    number: "4",
    title: "Bestehen",
    description:
      "Verfolge deinen Fortschritt, erkenne Schwächen und gehe perfekt vorbereitet in die Prüfung.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-primary mb-2">
            So funktioniert&apos;s
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            In 4 Schritten zur Bestnote
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step.number}
                </span>
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
