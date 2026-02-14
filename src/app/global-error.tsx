"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4 p-6">
          <h1 className="text-4xl font-bold">Etwas ist schiefgelaufen</h1>
          <p className="text-muted-foreground max-w-md">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
