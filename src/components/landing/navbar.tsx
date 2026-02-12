import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface NavbarProps {
  isLoggedIn: boolean;
}

export function Navbar({ isLoggedIn }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl flex h-14 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-bold">StudyApp</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <Link
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="hover:text-foreground transition-colors"
          >
            Preise
          </Link>
          <Link
            href="#faq"
            className="hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Button size="sm" asChild>
              <Link href="/dashboard">Zum Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Anmelden</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Kostenlos starten</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
