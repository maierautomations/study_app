"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

export default function CourseDetailError({
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
          <h2 className="text-xl font-semibold mb-2">Kurs konnte nicht geladen werden</h2>
          <p className="text-muted-foreground mb-6">
            Beim Laden des Kurses ist ein Fehler aufgetreten.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Link>
            </Button>
            <Button onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
