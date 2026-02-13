"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BookOpen, Tag, FileText, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface DocumentSummary {
  title: string;
  keyPoints: string[];
  keywords: string[];
  summary: string;
}

interface SummaryViewProps {
  documentId: string;
  documentName: string;
  cachedSummary: string | null;
  courseId?: string;
}

export function SummaryView({
  documentId,
  documentName,
  cachedSummary,
  courseId,
}: SummaryViewProps) {
  const [summary, setSummary] = useState<DocumentSummary | null>(
    cachedSummary ? JSON.parse(cachedSummary) : null
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!summary) return;
    const text = `${summary.title}\n\n${summary.summary}\n\nKernaussagen:\n${summary.keyPoints.map((p) => `• ${p}`).join("\n")}\n\nSchlüsselbegriffe: ${summary.keywords.join(", ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function generateSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fehler bei der Zusammenfassung");
      }
      setSummary(data.summary);
      toast.success("Zusammenfassung generiert!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Zusammenfassung fehlgeschlagen"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!summary) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Zusammenfassung</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
            Erstelle eine KI-generierte Zusammenfassung von &quot;{documentName}
            &quot; mit Kernaussagen und Schlüsselbegriffen.
          </p>
          <Button onClick={generateSummary} disabled={loading} size="sm">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird generiert...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Zusammenfassung generieren
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{summary.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Kopieren"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            {courseId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Als PDF exportieren"
                onClick={() =>
                  window.open(
                    `/api/export/summary?courseId=${courseId}&contentId=${documentId}`,
                    "_blank"
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary.summary}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Kernaussagen</h4>
          <ul className="space-y-1.5">
            {summary.keyPoints.map((point, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary font-medium mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Schlüsselbegriffe</h4>
          <div className="flex flex-wrap gap-1.5">
            {summary.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
