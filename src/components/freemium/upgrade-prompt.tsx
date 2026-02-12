"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Zap } from "lucide-react";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  used: number;
  limit: number;
}

export function UpgradePrompt({
  open,
  onOpenChange,
  used,
  limit,
}: UpgradePromptProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Limit erreicht
          </DialogTitle>
          <DialogDescription>
            Du hast dein monatliches Kontingent an KI-Generierungen aufgebraucht.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verbraucht</span>
              <span className="font-medium">
                {used} / {limit}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Premium-Vorteile</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unbegrenzte KI-Generierungen</li>
              <li>• Unbegrenzte Kurse und Dokumente</li>
              <li>• Prioritäts-Support</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Später
          </Button>
          <Button disabled>
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade (bald verfügbar)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Inline banner version for pages
export function UpgradeBanner({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;

  if (!isNearLimit) return null;

  return (
    <>
      <div
        className={`rounded-lg border p-4 flex items-center justify-between ${
          isAtLimit
            ? "bg-destructive/10 border-destructive/30"
            : "bg-yellow-500/10 border-yellow-500/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <Zap
            className={`h-5 w-5 ${
              isAtLimit ? "text-destructive" : "text-yellow-500"
            }`}
          />
          <div>
            <p className="text-sm font-medium">
              {isAtLimit
                ? "Limit erreicht"
                : "Limit fast erreicht"}
            </p>
            <p className="text-xs text-muted-foreground">
              {used} von {limit} KI-Generierungen verbraucht
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isAtLimit ? "destructive" : "outline"}
          onClick={() => setShowDialog(true)}
        >
          Upgrade
        </Button>
      </div>

      <UpgradePrompt
        open={showDialog}
        onOpenChange={setShowDialog}
        used={used}
        limit={limit}
      />
    </>
  );
}
