import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">StudyApp</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/impressum"
              className="hover:text-foreground transition-colors"
            >
              Impressum
            </Link>
            <Link
              href="/datenschutz"
              className="hover:text-foreground transition-colors"
            >
              Datenschutz
            </Link>
            <Link
              href="/#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="hover:text-foreground transition-colors"
            >
              Preise
            </Link>
          </nav>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} StudyApp. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
