"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "studyapp-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          Diese Website verwendet ausschließlich technisch notwendige Cookies
          für die Anmeldung und Sitzungsverwaltung. Kein Tracking, keine
          Analyse-Cookies.{" "}
          <Link
            href="/datenschutz"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Mehr erfahren
          </Link>
        </p>
        <Button onClick={accept} size="sm" className="shrink-0">
          Verstanden
        </Button>
      </div>
    </div>
  );
}
