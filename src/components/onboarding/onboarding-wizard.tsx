"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Upload,
  BrainCircuit,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  {
    title: "Willkommen bei StudyApp!",
    description:
      "Dein KI-gestützter Lernassistent. Lade deine Unterlagen hoch und lasse die KI Quizfragen, Flashcards und Erklärungen generieren.",
    icon: Sparkles,
  },
  {
    title: "Kurse erstellen",
    description:
      "Organisiere deine Materialien in Kursen — z.B. \"Lineare Algebra WS25\" oder \"Organische Chemie\". Jeder Kurs hat eigene Dokumente, Quizzes und Flashcards.",
    icon: BookOpen,
  },
  {
    title: "Dokumente hochladen",
    description:
      "Lade PDFs, Word-Dokumente oder Textdateien hoch. Die KI verarbeitet und analysiert den Inhalt automatisch.",
    icon: Upload,
  },
  {
    title: "Quiz & Flashcards",
    description:
      "Generiere automatisch Quizfragen und Flashcards aus deinen Dokumenten. Wähle Schwierigkeit und Fragenanzahl.",
    icon: BrainCircuit,
  },
  {
    title: "KI-Chat",
    description:
      "Stelle Fragen zu deinen Unterlagen und erhalte Antworten, die ausschließlich auf deinen Dokumenten basieren. Kein Halluzinieren!",
    icon: MessageSquare,
  },
];

export function OnboardingWizard({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const StepIcon = step.icon;

  async function handleComplete() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
    }
    toast.success("Onboarding abgeschlossen! Viel Erfolg beim Lernen!");
    onComplete();
    router.refresh();
  }

  function handleNext() {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>
              Schritt {currentStep + 1} von {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 mb-4" />
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            Zurück
          </Button>
          <Button onClick={handleNext}>
            {isLastStep ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Los geht&apos;s!
              </>
            ) : (
              <>
                Weiter
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
