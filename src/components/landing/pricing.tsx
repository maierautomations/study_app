import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingProps {
  isLoggedIn: boolean;
  userTier?: "free" | "premium" | null;
}

type TierKey = "free" | "basis" | "pro";

const tiers: {
  key: TierKey;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLoggedIn: string;
  href: string;
  popular: boolean;
}[] = [
  {
    key: "free",
    name: "Free",
    price: "0",
    period: "für immer",
    description: "Ideal zum Ausprobieren",
    features: [
      "20 KI-Generierungen / Monat",
      "3 Kurse",
      "5 Dokumente pro Kurs",
      "Quiz, Flashcards & Chat",
      "Spaced Repetition (SM-2)",
      "Gamification & Achievements",
    ],
    cta: "Kostenlos starten",
    ctaLoggedIn: "Aktueller Plan",
    href: "/register",
    popular: false,
  },
  {
    key: "basis",
    name: "Basis",
    price: "9,99",
    period: "pro Monat",
    description: "Für die Klausurenphase",
    features: [
      "150 KI-Generierungen / Monat",
      "Unbegrenzte Kurse",
      "20 Dokumente pro Kurs",
      "Alles aus Free +",
      "Zusammenfassungen pro Dokument",
      "Detaillierte Schwächenanalyse",
    ],
    cta: "Basis wählen",
    ctaLoggedIn: "Upgraden",
    href: "/register",
    popular: true,
  },
  {
    key: "pro",
    name: "Pro",
    price: "19,99",
    period: "pro Monat",
    description: "Für Power-Lerner",
    features: [
      "Unbegrenzte KI-Generierungen",
      "Unbegrenzte Kurse & Dokumente",
      "Alles aus Basis +",
      "Klausur-Simulator",
      "Lernplan-Generator",
      "Prioritäts-Support",
    ],
    cta: "Pro wählen",
    ctaLoggedIn: "Upgraden",
    href: "/register",
    popular: false,
  },
];

function getCTALabel(tier: TierKey, isLoggedIn: boolean, userTier: "free" | "premium" | null): string {
  if (!isLoggedIn) {
    return tiers.find((t) => t.key === tier)!.cta;
  }

  // Logged in: show current plan or upgrade
  if (userTier === "premium") {
    // Pro user: "Aktueller Plan" on Pro, "Zum Dashboard" on others
    return tier === "pro" ? "Aktueller Plan" : "Zum Dashboard";
  }

  // Free user
  if (tier === "free") return "Aktueller Plan";
  return `${tier === "basis" ? "Basis" : "Pro"} upgraden`;
}

function isCurrentPlan(tier: TierKey, userTier: "free" | "premium" | null): boolean {
  if (!userTier) return false;
  if (tier === "free" && userTier === "free") return true;
  if (tier === "pro" && userTier === "premium") return true;
  return false;
}

export function Pricing({ isLoggedIn, userTier = null }: PricingProps) {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-primary mb-2">Preise</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Einfach und transparent
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Starte kostenlos und upgrade wenn du mehr brauchst. Kein
            Kleingedrucktes, jederzeit kündbar.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => {
            const isCurrent = isLoggedIn && isCurrentPlan(tier.key, userTier);
            const ctaLabel = getCTALabel(tier.key, isLoggedIn, userTier);
            return (
              <Card
                key={tier.name}
                className={`relative flex flex-col ${
                  tier.popular
                    ? "border-primary shadow-lg ring-1 ring-primary"
                    : ""
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Beliebt
                  </Badge>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">€{tier.price}</span>
                    <span className="text-muted-foreground ml-1">
                      /{tier.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={isCurrent ? "secondary" : tier.popular ? "default" : "outline"}
                    disabled={isCurrent}
                    asChild={!isCurrent}
                  >
                    {isCurrent ? (
                      <span>{ctaLabel}</span>
                    ) : (
                      <Link href={isLoggedIn ? "/dashboard/settings" : tier.href}>
                        {ctaLabel}
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Alle Preise inkl. MwSt. Studenten-Rabatt: 40% auf alle Pläne mit
          .edu/.ac-E-Mail-Adresse.
        </p>
      </div>
    </section>
  );
}
