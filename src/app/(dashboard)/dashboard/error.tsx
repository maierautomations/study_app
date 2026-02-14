"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fehler aufgetreten</h2>
          <p className="text-muted-foreground mb-6">
            Beim Laden des Dashboards ist ein Fehler aufgetreten. Bitte versuche es erneut.
          </p>
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
