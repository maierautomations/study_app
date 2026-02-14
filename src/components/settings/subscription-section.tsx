"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";

interface SubscriptionSectionProps {
  tier: "free" | "premium";
  aiGenerationsUsed: number;
  aiGenerationsResetAt: string;
}

export function SubscriptionSection({
  tier,
  aiGenerationsUsed,
  aiGenerationsResetAt,
}: SubscriptionSectionProps) {
  const limit = tier === "premium" ? Infinity : 20;
  const usagePercent = tier === "premium" ? 0 : Math.min((aiGenerationsUsed / 20) * 100, 100);

  const resetDate = aiGenerationsResetAt
    ? new Date(aiGenerationsResetAt).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Abonnement
          <Badge variant={tier === "premium" ? "default" : "secondary"}>
            {tier === "premium" ? "Pro" : "Free"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Dein aktueller Plan und KI-Nutzung.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tier === "free" && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>KI-Generierungen</span>
                <span className="font-medium">
                  {aiGenerationsUsed} / {limit === Infinity ? "\u221E" : limit}
                </span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              {resetDate && (
                <p className="text-xs text-muted-foreground">
                  Zurückgesetzt am {resetDate}
                </p>
              )}
            </div>

            <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Upgrade auf Pro</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Unbegrenzte KI-Generierungen</li>
                <li>- Lernplan-Generator</li>
                <li>- Anki-Export</li>
                <li>- Notenprognose</li>
              </ul>
              <Button className="w-full mt-2" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Bald verfügbar
              </Button>
            </div>
          </>
        )}

        {tier === "premium" && (
          <div className="flex items-center gap-3 text-sm">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span>Du hast unbegrenzte KI-Generierungen und alle Pro-Features.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
