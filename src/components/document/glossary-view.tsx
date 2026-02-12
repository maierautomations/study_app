"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

type GlossaryTerm = {
  term: string;
  definition: string;
  context: string;
};

interface GlossaryViewProps {
  documentId: string;
  documentName: string;
  cachedGlossary: string | null;
}

export function GlossaryView({
  documentId,
  documentName,
  cachedGlossary,
}: GlossaryViewProps) {
  const [terms, setTerms] = useState<GlossaryTerm[] | null>(
    cachedGlossary ? JSON.parse(cachedGlossary) : null
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  async function generateGlossary() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast.error("KI-Limit erreicht", { description: data.error });
        } else {
          toast.error(data.error || "Glossar konnte nicht generiert werden");
        }
        return;
      }

      setTerms(data.glossary);
      setExpanded(true);
    } catch {
      toast.error("Fehler beim Generieren des Glossars");
    } finally {
      setLoading(false);
    }
  }

  const filteredTerms = terms?.filter(
    (t) =>
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by first letter
  const grouped = new Map<string, GlossaryTerm[]>();
  if (filteredTerms) {
    for (const term of filteredTerms) {
      const letter = term.term[0].toUpperCase();
      const existing = grouped.get(letter) ?? [];
      existing.push(term);
      grouped.set(letter, existing);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Glossar: {documentName}
          </CardTitle>
          {!terms ? (
            <Button
              size="sm"
              variant="outline"
              onClick={generateGlossary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Wird extrahiert...
                </>
              ) : (
                <>
                  <BookOpen className="mr-1 h-3 w-3" />
                  Glossar erstellen
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Einklappen" : "Aufklappen"}
              <Badge variant="secondary" className="ml-2">
                {terms.length} Begriffe
              </Badge>
            </Button>
          )}
        </div>
      </CardHeader>

      {terms && expanded && (
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Begriffe durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {filteredTerms && filteredTerms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Begriffe gefunden.
            </p>
          ) : (
            <div className="space-y-3">
              {Array.from(grouped.entries()).map(([letter, letterTerms]) => (
                <div key={letter}>
                  <p className="text-xs font-bold text-primary mb-1.5">
                    {letter}
                  </p>
                  <div className="space-y-2">
                    {letterTerms.map((t, i) => (
                      <div
                        key={`${t.term}-${i}`}
                        className="border rounded-lg p-2.5"
                      >
                        <p className="font-semibold text-sm">{t.term}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {t.definition}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1 italic">
                          {t.context}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
