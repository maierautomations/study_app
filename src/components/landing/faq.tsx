"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Welche Dateiformate kann ich hochladen?",
    answer:
      "Aktuell unterstützen wir PDF, DOCX und TXT Dateien. Weitere Formate wie PowerPoint-Folien sind in Planung.",
  },
  {
    question: "Wie funktioniert die KI-Quiz-Generierung?",
    answer:
      "Deine Dokumente werden in kleine Abschnitte aufgeteilt und eingebettet. Daraus generiert die KI verschiedene Fragetypen (Multiple Choice, Wahr/Falsch, offene Fragen) mit Erklärungen — alles auf Deutsch.",
  },
  {
    question: "Sind meine Daten sicher?",
    answer:
      "Ja. Deine Dokumente werden verschlüsselt gespeichert und nur für deine persönlichen Lernmaterialien verwendet. Wir verkaufen keine Daten und nutzen sie nicht zum Training von KI-Modellen. Alle Daten werden DSGVO-konform verarbeitet.",
  },
  {
    question: "Was ist Spaced Repetition?",
    answer:
      "Spaced Repetition (SM-2) ist ein wissenschaftlich bewiesener Lernalgorithmus, der berechnet, wann du eine Karte wiederholen solltest. Karten die du gut kennst, kommen seltener dran — schwierige Karten häufiger.",
  },
  {
    question: "Kann ich das Free-Tier dauerhaft nutzen?",
    answer:
      "Ja! Das Free-Tier ist nicht zeitlich begrenzt. Du bekommst 20 KI-Generierungen pro Monat, 3 Kurse und 5 Dokumente pro Kurs — perfekt zum Ausprobieren oder für einzelne Fächer.",
  },
  {
    question: "Wie kann ich upgraden oder kündigen?",
    answer:
      "Upgrades und Kündigungen sind jederzeit in den Einstellungen möglich. Es gibt keine Mindestlaufzeit. Die Stripe-Integration für Zahlungen wird in Kürze verfügbar sein.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-primary mb-2">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Häufige Fragen
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded-lg">
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <span className="font-medium text-sm">{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
