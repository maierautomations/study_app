import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Datenschutzerklärung — StudyApp",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Datenschutzerklärung
        </h1>
        <p className="text-muted-foreground mb-8">Stand: Februar 2026</p>

        <div className="prose prose-neutral max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              1. Verantwortlicher
            </h2>
            <p className="leading-7">
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO):
            </p>
            <p className="leading-7">
              Dominik Maier<br />
              Langer Rehm 25<br />
              24149 Kiel<br />
              E-Mail: dominik@maierai.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              2. Überblick der Verarbeitungen
            </h2>
            <p className="leading-7">
              Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten
              und die Zwecke ihrer Verarbeitung zusammen und verweist auf die
              betroffenen Personen.
            </p>
            <h3 className="text-lg font-medium mt-4 mb-2">
              Arten der verarbeiteten Daten
            </h3>
            <ul className="list-disc pl-6 space-y-1 leading-7">
              <li>Bestandsdaten (z.B. Name, E-Mail-Adresse)</li>
              <li>Inhaltsdaten (z.B. hochgeladene Dokumente, Texteingaben)</li>
              <li>Nutzungsdaten (z.B. Seitenaufrufe, Lernaktivitäten)</li>
              <li>Meta-/Kommunikationsdaten (z.B. IP-Adressen, Zeitangaben)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              3. Rechtsgrundlagen
            </h2>
            <p className="leading-7">
              Nachfolgend informieren wir Sie über die Rechtsgrundlagen der
              DSGVO, auf deren Basis wir personenbezogene Daten verarbeiten:
            </p>
            <ul className="list-disc pl-6 space-y-1 leading-7">
              <li>
                <strong>Einwilligung (Art. 6 Abs. 1 S. 1 lit. a DSGVO)</strong>{" "}
                — Die betroffene Person hat ihre Einwilligung in die
                Verarbeitung der sie betreffenden personenbezogenen Daten
                gegeben.
              </li>
              <li>
                <strong>
                  Vertragserfüllung (Art. 6 Abs. 1 S. 1 lit. b DSGVO)
                </strong>{" "}
                — Die Verarbeitung ist für die Erfüllung eines Vertrags
                erforderlich, z.B. Bereitstellung eines Benutzerkontos und der
                App-Funktionen.
              </li>
              <li>
                <strong>
                  Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f DSGVO)
                </strong>{" "}
                — Die Verarbeitung ist zur Wahrung berechtigter Interessen
                erforderlich, z.B. Sicherheit und Verbesserung unserer Dienste.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              4. Registrierung und Benutzerkonto
            </h2>
            <p className="leading-7">
              Nutzer können ein Benutzerkonto anlegen. Im Rahmen der
              Registrierung werden die erforderlichen Pflichtangaben (E-Mail-Adresse,
              Passwort) den Nutzern mitgeteilt und auf Grundlage der
              Vertragserfüllung verarbeitet. Die gespeicherten Daten umfassen
              insbesondere die Login-Informationen (E-Mail, gehashtes Passwort).
            </p>
            <p className="leading-7">
              Die Authentifizierung erfolgt über{" "}
              <strong>Supabase Auth</strong> (Supabase Inc., USA). Supabase
              speichert Authentifizierungsdaten gemäß ihrer Datenschutzrichtlinie.
              Es besteht ein Angemessenheitsbeschluss (EU-US Data Privacy
              Framework).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              5. Hochgeladene Dokumente und KI-Verarbeitung
            </h2>
            <p className="leading-7">
              Nutzer können Dokumente (PDF, DOCX, TXT) hochladen, die in{" "}
              <strong>Supabase Storage</strong> gespeichert werden. Diese
              Dokumente werden ausschließlich zur Bereitstellung der
              App-Funktionalitäten (Quiz-Generierung, Flashcard-Erstellung,
              Chat) verarbeitet.
            </p>
            <p className="leading-7">
              Zur KI-Verarbeitung werden Textauszüge an{" "}
              <strong>OpenAI</strong> (OpenAI, L.L.C., USA) übermittelt, um
              Embeddings, Quizfragen, Flashcards und Zusammenfassungen zu
              generieren. OpenAI verarbeitet diese Daten gemäß ihrer API Data
              Usage Policy und nutzt eingesendete Daten nicht zum Training
              ihrer Modelle.
            </p>
            <p className="leading-7">
              <strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1
              S. 1 lit. b DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              6. Hosting und Infrastruktur
            </h2>
            <p className="leading-7">
              Diese Anwendung wird auf <strong>Vercel</strong> (Vercel Inc.,
              USA) gehostet. Beim Aufruf unserer App werden automatisch vom
              Webserver Informationen erfasst (Server-Logfiles), darunter
              IP-Adresse, Browsertyp, Betriebssystem und aufgerufene Seite.
            </p>
            <p className="leading-7">
              Die Datenbank und Dateispeicherung erfolgt über{" "}
              <strong>Supabase</strong> (Supabase Inc., USA). Für die
              Datenübermittlung in die USA besteht ein Angemessenheitsbeschluss
              (EU-US Data Privacy Framework).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Cookies</h2>
            <p className="leading-7">
              Wir verwenden ausschließlich{" "}
              <strong>technisch notwendige Cookies</strong> für die
              Authentifizierung und Sitzungsverwaltung (Supabase Auth Session
              Cookies). Diese Cookies sind für den Betrieb der Anwendung
              zwingend erforderlich.
            </p>
            <p className="leading-7">
              Es werden <strong>keine</strong> Tracking-, Analyse- oder
              Marketing-Cookies verwendet. Eine Einwilligung ist für technisch
              notwendige Cookies nicht erforderlich (§ 25 Abs. 2 TDDDG).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              8. Ihre Rechte als betroffene Person
            </h2>
            <p className="leading-7">
              Sie haben gemäß DSGVO folgende Rechte:
            </p>
            <ul className="list-disc pl-6 space-y-1 leading-7">
              <li>
                <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie haben das
                Recht, Auskunft über Ihre bei uns gespeicherten Daten zu
                erhalten.
              </li>
              <li>
                <strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie können
                die Berichtigung unrichtiger Daten verlangen.
              </li>
              <li>
                <strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie können die
                Löschung Ihrer Daten verlangen, soweit keine gesetzliche
                Aufbewahrungspflicht entgegensteht.
              </li>
              <li>
                <strong>
                  Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):
                </strong>{" "}
                Sie können die Einschränkung der Verarbeitung verlangen.
              </li>
              <li>
                <strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong>{" "}
                Sie haben das Recht, Ihre Daten in einem strukturierten Format
                zu erhalten.
              </li>
              <li>
                <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können
                der Verarbeitung Ihrer Daten widersprechen.
              </li>
              <li>
                <strong>Beschwerderecht:</strong> Sie haben das Recht, sich bei
                einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständige
                Aufsichtsbehörde: Unabhängiges Landeszentrum für Datenschutz
                Schleswig-Holstein (ULD), Holstenstraße 98, 24103 Kiel.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              9. Datenlöschung und Speicherdauer
            </h2>
            <p className="leading-7">
              Personenbezogene Daten werden gelöscht oder gesperrt, sobald der
              Zweck der Speicherung entfällt. Bei Löschung des Benutzerkontos
              werden alle zugehörigen Daten (Profil, Kurse, Dokumente,
              Quizzes, Flashcards, Chat-Verläufe) innerhalb von 30 Tagen
              gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">
              10. Änderungen dieser Datenschutzerklärung
            </h2>
            <p className="leading-7">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit
              sie stets den aktuellen rechtlichen Anforderungen entspricht oder
              um Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten
              Besuch gilt dann die neue Datenschutzerklärung.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
