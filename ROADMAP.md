# StudyApp — Feature-Roadmap & Pricing-Strategie

> Erstellt: 2026-02-11 | Status: Phase 1-3 + A + B + C abgeschlossen | Nächste: Phase D

---

## 1. Feature-Matrix (Free vs. Basis vs. Pro)

### Legende
- **AI** = Braucht API-Call (Token-Kosten)
- **Algo** = Rein algorithmisch / client-seitig (keine API-Kosten)
- **Hybrid** = Einmalig AI, danach Algo

| Feature | Free | Basis (€9,99/mo) | Pro (€19,99/mo) | Typ | Phase |
|---------|------|-------------------|------------------|-----|-------|
| **Kern-Features** | | | | | |
| Kurse erstellen (unbegrenzt) | ✅ 3 Kurse | ✅ Unbegrenzt | ✅ Unbegrenzt | — | ✅ |
| Dokument-Upload (PDF/DOCX/TXT) | ✅ 5 Docs/Kurs | ✅ 20 Docs/Kurs | ✅ Unbegrenzt | — | ✅ |
| AI-Quiz-Generierung | ✅ 20/mo | ✅ 150/mo | ✅ Unbegrenzt | AI | ✅ |
| AI-Flashcard-Generierung | ✅ 20/mo | ✅ 150/mo | ✅ Unbegrenzt | AI | ✅ |
| RAG-Chat (Fragen zu Dokumenten) | ✅ 20/mo | ✅ 150/mo | ✅ Unbegrenzt | AI | ✅ |
| Gamification (XP, Streaks, Achievements) | ✅ | ✅ | ✅ | Algo | ✅ |
| Onboarding Wizard | ✅ | ✅ | ✅ | — | ✅ |
| **Phase C** ✅ | | | | | |
| Spaced Repetition (SM-2) | ✅ | ✅ | ✅ | Algo | ✅ C |
| Review-Sessions (fällige Karten) | ✅ | ✅ | ✅ | Algo | ✅ C |
| Achievements-Seite | ✅ | ✅ | ✅ | Algo | ✅ C |
| Freemium Enforcement | ✅ (20/mo) | ✅ (150/mo) | ✅ (∞) | — | ✅ C |
| **Phase D** | | | | | |
| Landing Page | ✅ | ✅ | ✅ | — | D |
| Zusammenfassungen pro Dokument | ❌ | ✅ | ✅ | AI | D |
| Schwächenanalyse (aus Quiz-Ergebnissen) | ✅ Basis | ✅ Detail | ✅ Detail | Algo | D |
| Lernstatistiken & Fortschritts-Dashboard | ✅ Basis | ✅ Erweitert | ✅ Erweitert | Algo | D |
| Quiz-Fragetyp-Auswahl (MC/Wahr-Falsch/Offen) | ✅ | ✅ | ✅ | — | D |
| **Phase E** | | | | | |
| Klausur-Simulator (Probeklausur + Noten) | ❌ | ✅ | ✅ | AI | E |
| Multi-Output (Quiz+Flashcards+Summary) | ❌ | ✅ | ✅ | AI | E |
| Fachbegriff-Glossar (auto-extrahiert) | ❌ | ✅ | ✅ | AI | E |
| Lernplan-Generator (Prüfungsdatum) | ❌ | ❌ | ✅ | AI | E |
| Export (PDF: Quizzes/Flashcards/Summary) | ❌ | ✅ PDF | ✅ PDF+Anki | Algo | E |
| Notenprognose (aus Quiz-Scores) | ❌ | ❌ | ✅ | Algo | E |
| Stripe-Integration (Zahlungen) | — | ✅ | ✅ | — | E |
| **Phase F** | | | | | |
| Mündliche-Prüfung-Coach (Voice) | ❌ | ❌ | ✅ | AI | F |
| Gruppenlernen (geteilte Kurse) | ❌ | ✅ (2 Pers.) | ✅ (10 Pers.) | — | F |
| Moodle/ILIAS Import | ❌ | ❌ | ✅ | — | F |
| PWA / Mobile-Optimierung | ✅ | ✅ | ✅ | — | F |
| Audio-Zusammenfassungen (TTS) | ❌ | ❌ | ✅ | AI | F |
| **Phase G** | | | | | |
| Sprachmemo-Upload + Transkription | ❌ | ✅ | ✅ | AI | G |
| YouTube-Link Transkription | ❌ | ✅ | ✅ | AI/Free | G |

### Conversion Trigger (Features die zum Upgrade bewegen)

1. **Free → Basis**: Limit von 20 AI-Generierungen/Monat erreicht (besonders in der Klausurenphase), Zusammenfassungen als Preview sichtbar aber gesperrt, Klausur-Simulator-Vorschau
2. **Basis → Pro**: Lernplan-Generator ("Bestehe deine Prüfung am X"), Notenprognose, mündliche Prüfung Coach, unbegrenzte AI-Generierungen für Power-User

---

## 2. Pricing-Tabelle

### Monatliche Preise

| | Free | Basis | Pro |
|---|---|---|---|
| **Monatspreis** | €0 | €9,99/mo | €19,99/mo |
| **Jahrespreis** | €0 | €7,49/mo (€89,88/yr) | €14,99/mo (€179,88/yr) |
| **Jahres-Rabatt** | — | 25% | 25% |
| **Studenten-Rabatt** | — | €5,99/mo (€59,88/yr) | €11,99/mo (€119,88/yr) |
| | | | |
| **AI-Generierungen/Monat** | 20 | 150 | Unbegrenzt |
| **Kurse** | 3 | Unbegrenzt | Unbegrenzt |
| **Docs pro Kurs** | 5 | 20 | Unbegrenzt |
| **Max. Dateigröße** | 10 MB | 25 MB | 50 MB |

### Begründung der Preisgestaltung

| Aspekt | Entscheidung | Rationale |
|--------|-------------|-----------|
| Free-Tier Limits | 20 Gen/mo, 3 Kurse | Genug zum Ausprobieren (2-3 Quizzes + Flashcards + Chat), aber zu wenig für intensive Klausurenphase. Kurslimit motiviert Upgrade bei >1 Fach. |
| Basis bei €9,99 | 150 Gen/mo | Unter Quizlet Plus ($7,99 ≈ €7,50), aber über Knowt. 150 Gen reichen für ~3-4 Fächer. Konkurrenzfähig im DACH-Markt. |
| Pro bei €19,99 | Unbegrenzt | Unter Grammarly Premium (€20+). Für Power-User in der Klausurenphase. Unlimited entfernt mentale Bremse. |
| Studenten-Rabatt | 40% auf Basis, 40% auf Pro | Verifizierung via .edu/.ac.at Email oder SheerID. Senkt Basis auf €5,99 — unter €6 psychologische Schwelle. |
| Jahresrabatt | 25% | Industriestandard (Quizlet: ~25%, Grammarly: ~30%). Erhöht LTV, reduziert Churn in Semesterferien. |
| Feature-Gating | Primär Feature-basiert | Kein reines Usage-Gating — Studis wollen in der Klausurenphase keine Überraschungskosten. Basis-Limit (150) ist so hoch, dass es selten erreicht wird → psychologische Sicherheit. |

### Revenue-Projektion (konservativ)

| Metrik | Monat 3 | Monat 6 | Monat 12 |
|--------|---------|---------|----------|
| Registrierte User | 500 | 2.000 | 8.000 |
| Free | 425 (85%) | 1.600 (80%) | 6.000 (75%) |
| Basis | 50 (10%) | 280 (14%) | 1.360 (17%) |
| Pro | 25 (5%) | 120 (6%) | 640 (8%) |
| **MRR** | **€999** | **€5.196** | **€26.391** |
| API-Kosten (geschätzt) | ~€15 | ~€80 | ~€400 |
| **Marge** | **~98%** | **~98%** | **~98%** |

> API-Kosten sind bei GPT-4o-mini extrem niedrig. Die Hauptkosten sind Infrastruktur (Vercel, Supabase) und Marketing.

---

## 3. Implementierungsplan (Phasen C–F)

### Phase C: Spaced Repetition + Freemium ✅ (abgeschlossen 2026-02-12)

> **Ziel**: App ist feature-complete für den Kernwert (Lernen + Wiederholen) und monetarisierbar.
> **Geschätzter Umfang**: ~15 Dateien, mittlere Komplexität

#### C1. SM-2 Algorithmus
**Datei**: `src/lib/spaced-repetition.ts` (neu)

```
Implementierung:
- SM-2 Funktion: (quality: 0-5, previousInterval, previousEaseFactor) → { interval, easeFactor, nextReviewDate }
- Qualitäts-Mapping: 4 Buttons → SM-2 Werte
  - "Nochmal" = 1 (Blackout)
  - "Schwer" = 3 (Richtig mit Mühe)
  - "Gut" = 4 (Richtig nach Nachdenken)
  - "Einfach" = 5 (Sofort gewusst)
- Neue Karten starten mit interval=0, easeFactor=2.5
- Bei quality < 3: Karte zurücksetzen (interval=0), easeFactor bleibt
```

#### C2. Review API Routes
**Dateien**:
- `src/app/api/flashcards/review/route.ts` (neu) — POST: Review aufzeichnen + SM-2 berechnen + neues `flashcard_reviews` Row mit `next_review_at`
- `src/app/api/flashcards/due/route.ts` (neu) — GET: Fällige Karten (`next_review_at <= now()` UNION noch nie reviewte Karten), gruppiert nach Kurs

```
GET /api/flashcards/due?courseId=xxx (optional)
→ { dueCards: [...], totalDue: number, byCourse: { courseId: count } }

POST /api/flashcards/review
Body: { flashcardId, quality: 1|3|4|5 }
→ { nextReviewAt, interval, easeFactor, xpEarned }
```

#### C3. Review Session Pages
**Dateien**:
- `src/app/(dashboard)/dashboard/reviews/page.tsx` (neu) — Übersicht: Fällige Karten pro Kurs, Streak-Reminder, "Jetzt lernen" Button
- `src/app/(dashboard)/dashboard/reviews/[courseId]/page.tsx` (neu) — Interaktive Review-Session
- `src/components/flashcard/review-session.tsx` (neu) — Client Component: Karte anzeigen → flippen → 4 Bewertungs-Buttons → SM-2 → nächste Karte → Session-Zusammenfassung (Karten gelernt, XP verdient, nächste fällige)

```
Review Session Flow:
1. Fällige Karten laden (max 20 pro Session)
2. Karte zeigen (Front)
3. User klickt "Antwort zeigen" → Flip zu Back
4. 4 Buttons: Nochmal | Schwer | Gut | Einfach
5. POST /api/flashcards/review → SM-2 berechnet nächstes Datum
6. Nächste Karte (oder "Nochmal"-Karten am Ende wiederholen)
7. Session-Ende: Zusammenfassung + XP + Gamification-Tracking
```

#### C4. Achievements Page
**Dateien**:
- `src/app/(dashboard)/dashboard/achievements/page.tsx` (neu) — Server Component: Alle Achievements laden + User-Status
- `src/components/gamification/achievements-grid.tsx` (neu) — Grid mit Kategorien (Kurse, Dokumente, Quizzes, Flashcards, Streaks, Level), freigeschaltete = farbig + Datum, gesperrte = grau + Beschreibung + Fortschrittsbalken

#### C5. Freemium Enforcement
**Dateien**:
- `src/lib/freemium.ts` (neu) — `checkFreemiumLimit(userId)`: Prüft `ai_generations_used` vs. Tier-Limit, auto-reset wenn `ai_generations_reset_at` > 30 Tage
- Bestehende API Routes anpassen (Limit-Check am Anfang):
  - `src/app/api/quiz/generate/route.ts` — Limit-Check + Increment hinzufügen
  - `src/app/api/flashcards/generate/route.ts` — Limit-Check + Increment hinzufügen
  - `src/app/api/chat/route.ts` — Limit-Check + Increment hinzufügen
- `src/components/freemium/upgrade-prompt.tsx` (neu) — Modal/Banner wenn Limit erreicht: "Du hast X von Y KI-Generierungen verbraucht. Upgrade für mehr."

```typescript
// src/lib/freemium.ts
const TIER_LIMITS = {
  free: 20,
  basis: 150,
  pro: Infinity, // oder Number.MAX_SAFE_INTEGER
} as const;

async function checkFreemiumLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  tier: string;
}>
```

#### C6. Nutzungszähler-Update
**Datei**: `src/components/gamification/usage-meter.tsx` (existiert) — Anpassen: Farbe basierend auf Prozent (grün <50%, gelb 50-80%, rot >80%), Click → Upgrade-Prompt

#### C-Reihenfolge
1. C1 (SM-2 Algo) → C2 (API Routes) → C3 (Review Pages) — aufeinander aufbauend
2. C4 (Achievements Page) — unabhängig, parallel möglich
3. C5 (Freemium) → C6 (Usage Meter) — aufeinander aufbauend

---

### Phase D: Launch-Ready (Landing Page + Kernverbesserungen)

> **Ziel**: App ist öffentlich launchbar mit überzeugender Landing Page und den wichtigsten "Wow"-Features.
> **Geschätzter Umfang**: ~12 Dateien

#### D1. Landing Page
**Datei**: `src/app/page.tsx` (überschreiben — aktuell Next.js Boilerplate)

```
Struktur:
- Navbar: Logo | Features | Preise | Login | Kostenlos starten
- Hero Section: "Bestehe jede Prüfung — mit KI" + Untertitel + CTA + App-Screenshot
- Pain Point: "Stundenlang Karteikarten schreiben? Das war gestern."
- Feature Grid (3 Spalten): Dokumente → Quiz → Chat
- "So funktioniert's" (4 Schritte): Hochladen → Generieren → Lernen → Bestehen
- Social Proof: "Für Studierende im DACH-Raum" + Uni-Logos (wenn verfügbar)
- Pricing Section: 3 Tiers mit CTA
- FAQ: 5-6 häufige Fragen
- Footer: Links, Impressum, Datenschutz (DSGVO-Pflicht!)
```

**Zusätzliche Dateien**:
- `src/components/landing/hero.tsx`
- `src/components/landing/features.tsx`
- `src/components/landing/pricing.tsx`
- `src/components/landing/faq.tsx`

#### D2. Zusammenfassungen (Basis + Pro)
**Dateien**:
- `src/app/api/documents/summarize/route.ts` (neu) — POST: Dokument-Chunks → `generateObject()` → strukturierte Zusammenfassung (Kernaussagen, Schlüsselbegriffe, 300 Wörter)
- `src/components/document/summary-view.tsx` (neu) — Zusammenfassung anzeigen, gespeichert in `documents.content_text` Feld oder neue Spalte `summary`
- DB-Migration: `ALTER TABLE documents ADD COLUMN summary text;`

```
Kosten pro Zusammenfassung: ~$0.0004 (2k Input, 400 Output @ GPT-4o-mini)
→ Extrem günstig, hoher wahrgenommener Wert
→ Caching: Einmal generiert, immer verfügbar
```

#### D3. Schwächenanalyse (Client-seitig)
**Dateien**:
- `src/lib/analytics.ts` (neu) — Algorithmus: Quiz-Attempts analysieren, Fragen nach Thema/Dokument gruppieren, Fehlerquoten berechnen
- `src/components/progress/weakness-chart.tsx` (neu) — Visualisierung: Balkendiagramm der schwächsten Themen, Empfehlung ("Wiederhole Kapitel 3: Lineare Abbildungen")
- `src/app/(dashboard)/dashboard/courses/[courseId]/progress/page.tsx` (existiert laut Plan) — Anpassen

```
Algorithmus (0 API-Kosten):
1. Alle quiz_attempts für den Kurs laden
2. Fragen nach source document_id gruppieren
3. Fehlerquote pro Dokument berechnen
4. Top-3 Schwachstellen anzeigen
5. "Quiz nur zu diesem Thema erstellen" Button
```

#### D5. DSGVO-Compliance (Pflicht vor Launch!)
**Dateien**:
- `src/app/datenschutz/page.tsx` (neu) — Datenschutzerklärung
- `src/app/impressum/page.tsx` (neu) — Impressum (gesetzlich vorgeschrieben in DACH)
- `src/components/cookie-banner.tsx` (neu) — Minimaler Cookie-Banner (Supabase Auth Cookies = technisch notwendig, kein Tracking = einfach)

#### D6. Quiz-Fragetyp-Auswahl (UX-Verbesserung)
**Dateien**:
- `src/app/(dashboard)/dashboard/courses/[courseId]/quiz/new/page.tsx` (anpassen) — Checkboxen für Fragetypen
- `src/app/api/quiz/generate/route.ts` (anpassen) — `questionTypes` Parameter im Prompt

```
UI: Vor der Quiz-Generierung kann der User auswählen:
☑ Multiple Choice
☑ Wahr/Falsch
☑ Offene Fragen

Default: Alle angehakt
Min: Mindestens 1 Typ ausgewählt
Der System-Prompt an die AI wird entsprechend angepasst:
"Generiere nur Multiple-Choice und Wahr/Falsch Fragen" etc.
Kein API-Mehraufwand — nur Prompt-Anpassung.
```

#### D-Reihenfolge
1. D5 (DSGVO) — Muss vor Launch stehen, klein aber kritisch
2. D1 (Landing Page) — Hauptarbeit
3. D2 (Zusammenfassungen) — Schneller AI-Feature-Win
4. D3 (Schwächenanalyse) — Kein API-Aufwand, hoher Wert
5. D6 (Quiz-Fragetyp-Auswahl) — Kleine UX-Verbesserung, schnell

> **Hinweis**: D4 (Vercel Deployment) wurde in eine eigene spätere Phase verschoben — siehe nach Phase E.

---

### Phase E: Monetarisierung + Premium-Features

> **Ziel**: Revenue generieren, Premium-Features die den Upgrade-Preis rechtfertigen.
> **Geschätzter Umfang**: ~20 Dateien

#### E1. Stripe-Integration
**Dateien**:
- `src/lib/stripe.ts` (neu) — Stripe Client, Checkout Session erstellen, Webhook Handler
- `src/app/api/stripe/checkout/route.ts` (neu) — POST: Checkout Session für Basis/Pro
- `src/app/api/stripe/webhook/route.ts` (neu) — POST: Stripe Webhook → `profiles.tier` updaten
- `src/app/(dashboard)/dashboard/settings/page.tsx` (anpassen) — Abo-Verwaltung, aktueller Plan, Upgrade/Downgrade
- `src/components/pricing/checkout-button.tsx` (neu)

```
Stripe Products (zu erstellen):
- studyapp_basis_monthly: €9,99/mo
- studyapp_basis_yearly: €89,88/yr (€7,49/mo)
- studyapp_pro_monthly: €19,99/mo
- studyapp_pro_yearly: €179,88/yr (€14,99/mo)

Webhook Events:
- checkout.session.completed → tier = 'basis' oder 'pro'
- customer.subscription.deleted → tier = 'free'
- invoice.payment_failed → E-Mail-Warnung
```

#### E2. Klausur-Simulator
**Dateien**:
- `src/app/api/exam/generate/route.ts` (neu) — POST: Generiert Probeklausur (gewichtete Frageauswahl nach Schwäche, Zeitlimit, Punkteverteilung)
- `src/app/(dashboard)/dashboard/courses/[courseId]/exam/page.tsx` (neu) — Klausur-UI
- `src/components/exam/exam-session.tsx` (neu) — Timer, Fragenavigation, "Abgeben" Button
- `src/components/exam/exam-result.tsx` (neu) — Ergebnis mit deutschem Notensystem

```
Deutsches Notensystem:
- 1,0 (95-100%) — Sehr gut
- 1,3 (90-94%)
- 1,7 (85-89%)
- 2,0 (80-84%) — Gut
- 2,3 (75-79%)
- 2,7 (70-74%)
- 3,0 (65-69%) — Befriedigend
- 3,3 (60-64%)
- 3,7 (55-59%)
- 4,0 (50-54%) — Ausreichend (bestanden)
- 5,0 (<50%) — Nicht bestanden

Features:
- Zeitlimit wählbar (30/60/90/120 min)
- Mix aus MC, Wahr/Falsch, Freitext
- Gewichtung: Mehr Fragen zu schwachen Themen
- Historische Klausur-Ergebnisse vergleichen
```

#### E3. Multi-Output Generation (75% Token-Ersparnis)
**Datei**: `src/app/api/documents/generate-all/route.ts` (neu)

```
Ein API-Call generiert:
- 10 Quiz-Fragen
- 20 Flashcards
- 1 Zusammenfassung (300 Wörter)

Token-Verbrauch:
- Einzeln: ~2k + 800 + 2k + 1k + 2k + 400 = 8.2k Tokens
- Multi-Output: ~2k Input + 2.4k Output = 4.4k Tokens
→ 46% weniger Tokens, 75% weniger API-Calls (Latenz!)

Trigger: "Alles generieren" Button auf Kurs-Detailseite
Nur für Basis + Pro User.
```

#### E4. Fachbegriff-Glossar
**Dateien**:
- `src/app/api/documents/glossary/route.ts` (neu) — POST: Extrahiert Fachbegriffe + Definitionen aus Chunks
- `src/components/document/glossary-view.tsx` (neu) — Alphabetisch sortiert, durchsuchbar, verlinkt zu Quell-Chunks
- DB: Neue Tabelle `glossary_terms` oder in `documents`-Metadaten

```
Kosten: ~$0.0005 pro Dokument (einmalig, dann gecacht)
Hoher wahrgenommener Wert für Studierende!
Bonus: Glossar-Begriffe als Flashcards exportieren (0 Extra-Kosten)
```

#### E5. Lernplan-Generator (Pro only)
**Dateien**:
- `src/app/api/study-plan/generate/route.ts` (neu) — POST: Prüfungsdatum + Stoffmenge + bisherige Scores → AI generiert Tagesplan
- `src/components/study-plan/plan-view.tsx` (neu) — Kalender-Ansicht, tägliche Aufgaben, Fortschrittsbalken
- `src/app/(dashboard)/dashboard/study-plan/page.tsx` (neu)

```
Input: Prüfungsdatum, Kurse/Dokumente, aktuelle Stärken/Schwächen
Output: Tag-für-Tag Plan ("Mo: Kapitel 3 wiederholen, 20 Flashcards, 1 Quiz")
Kosten: ~$0.001 pro Plan (einmalig, sehr günstig)
Update: Automatisch anpassen wenn Quiz-Scores sich ändern
```

#### E6. Export-Funktionen
**Dateien**:
- `src/lib/export/pdf-generator.ts` (neu) — Quiz/Flashcards/Summary als PDF
- `src/lib/export/anki-export.ts` (neu, Pro only) — Flashcards als Anki-kompatible `.apkg` Datei
- `src/app/api/export/[type]/route.ts` (neu)

```
Formate:
- Basis: PDF-Export (Quizzes, Flashcards, Zusammenfassungen)
- Pro: PDF + Anki-Export (für User die parallel Anki nutzen)
Bibliothek: pdfkit oder @react-pdf/renderer (server-side)
Kein AI nötig — rein algorithmisch!
```

#### E7. Notenprognose (Pro only)
**Datei**: `src/lib/analytics.ts` (erweitern) — Rein algorithmisch

```
Algorithmus (0 API-Kosten):
1. Letzte 5 Quiz-Scores pro Kurs sammeln
2. Gewichteter Durchschnitt (neuere Scores zählen mehr)
3. Trend-Berechnung (besser/schlechter werdend)
4. Mapping auf deutsches Notensystem
5. Konfidenz-Intervall (basierend auf Streuung)
Anzeige: "Prognostizierte Note: 2,3 (±0,4)" mit Trend-Pfeil
```

#### E-Reihenfolge
1. E1 (Stripe) — Monetarisierung aktivieren, höchste Priorität
2. E3 (Multi-Output) — Kostenoptimierung, sofort spürbar
3. E2 (Klausur-Simulator) — Killer-Feature, stärkster Conversion Trigger
4. E4 (Glossar) — Günstig, schnell, hoher Wert
5. E6 (Export) — Oft nachgefragt, kein AI nötig
6. E5 (Lernplan) — Pro-Differenzierung
7. E7 (Notenprognose) — Klein, rein algorithmisch, Cherry on top

---

### Vercel Deployment (nach Phase E, vor Launch)

> **Ziel**: App produktionsreif deployen.

**Dateien**:
- `next.config.ts` — `maxDuration` für API Routes setzen
- `vercel.json` (neu, falls nötig) — Region: `fra1` (Frankfurt, DACH-nah)
- Environment Variables in Vercel Dashboard

```
API Route Timeouts:
- /api/documents/process: maxDuration = 60
- /api/quiz/generate: maxDuration = 30
- /api/flashcards/generate: maxDuration = 30
- /api/chat: maxDuration = 30
- /api/documents/summarize: maxDuration = 30
```

---

### Phase F: Wachstum + Differenzierung

> **Ziel**: Features die StudyApp von Quizlet/Knowt/Anki klar abgrenzen und virales Wachstum ermöglichen.
> **Geschätzter Umfang**: Größer, kann über mehrere Monate verteilt werden

#### F1. Mündliche-Prüfung-Coach (Pro only)
**Konzept**: Voice-basierte Übungsgespräche mit AI-Prüfer

```
Technologie:
- Web Speech API (Browser-nativ, kostenlos) für Speech-to-Text
- OpenAI TTS oder Browser SpeechSynthesis für Text-to-Speech
- GPT-4o-mini für Prüfer-Persona (Kontext: Kurs-Dokumente)

Kosten-Analyse:
- STT: Web Speech API = $0 (Browser)
- TTS: OpenAI TTS = $15/1M chars → ~$0.003 pro Antwort
- LLM: GPT-4o-mini = ~$0.0005 pro Turn
→ Pro Session (10 Turns): ~$0.035
→ Nur für Pro-User vertretbar (€19,99/mo)

Alternativ: Nur Text-basiert als Basis-Feature (€0 TTS-Kosten), Voice als Pro-Upgrade
```

#### F2. Gruppenlernen
**Konzept**: Kurse teilen, gemeinsam lernen

```
DB-Änderungen:
- Neue Tabelle: course_members (course_id, user_id, role: 'owner'|'member', invited_at)
- RLS anpassen: Mitglieder können Kurs-Inhalte sehen

Features:
- Basis: Kurs mit 1 Person teilen (Lernpartner)
- Pro: Bis zu 10 Personen (Lerngruppe)
- Einladung per Link oder Email
- Geteilte Flashcard-Decks und Quizzes
- Privat: Eigene Ergebnisse bleiben privat

Viraler Effekt: Jeder eingeladene User muss Account erstellen → Akquisition!
```

#### F3. Moodle/ILIAS Import (Pro only)
**Konzept**: Direkt-Import aus Uni-LMS

```
- Moodle: REST API oder Backup-XML-Import
- ILIAS: SOAP API oder Export-Datei-Import
- Erspart manuellen Dokument-Upload
- Einmaliger Setup pro Kurs, dann Auto-Sync
```

#### F4. PWA + Mobile-Optimierung
**Konzept**: Progressive Web App für Mobile

```
Dateien:
- public/manifest.json — PWA Manifest
- src/app/sw.ts — Service Worker (Offline-Cache für Flashcard-Reviews)
- Responsive Design audit für alle Seiten

Features:
- "Zum Startbildschirm hinzufügen" Prompt
- Offline Flashcard-Reviews (SM-2 lokal, Sync bei Verbindung)
- Push-Notifications für fällige Reviews und Streak-Reminder
```

#### F5. Audio-Zusammenfassungen (Pro only)
**Konzept**: TTS-generierte Audio-Zusammenfassungen zum Anhören

```
- Zusammenfassung → OpenAI TTS API → MP3
- Kosten: ~$0.015 pro Zusammenfassung (1000 chars)
- Gespeichert in Supabase Storage (einmalig generiert)
- "Podcast-Modus": Zusammenfassungen mehrerer Dokumente hintereinander
Anwendungsfall: Beim Pendeln oder Sport lernen
```

---

## 4. Kosteneffizienz-Maßnahmen

### 4.1 AI vs. Algorithmisch — Was braucht wirklich AI?

| Feature | AI nötig? | Kosten/Aufruf | Caching möglich? |
|---------|-----------|---------------|-----------------|
| Quiz-Generierung | ✅ Ja | ~$0.0005 | ✅ Pro Dokument+Schwierigkeit |
| Flashcard-Generierung | ✅ Ja | ~$0.0006 | ✅ Pro Dokument |
| RAG-Chat | ✅ Ja | ~$0.0002 | ❌ Jede Frage einzigartig |
| Zusammenfassung | ✅ Ja (einmalig) | ~$0.0004 | ✅ 1x generieren, immer nutzen |
| Klausur-Simulator | ✅ Ja (Generierung) | ~$0.0008 | ✅ Fragen wiederverwenden |
| Glossar-Extraktion | ✅ Ja (einmalig) | ~$0.0005 | ✅ 1x pro Dokument |
| Lernplan | ✅ Ja (einmalig) | ~$0.001 | ✅ 1x generieren, bei Bedarf aktualisieren |
| Mündliche Prüfung | ✅ Ja (pro Turn) | ~$0.0035 | ❌ Konversationell |
| Audio-Summary | ✅ TTS | ~$0.015 | ✅ 1x generieren |
| **Spaced Repetition** | **❌ Nein** | $0 | — SM-2 ist rein mathematisch |
| **Schwächenanalyse** | **❌ Nein** | $0 | — Statistische Auswertung |
| **Notenprognose** | **❌ Nein** | $0 | — Gewichteter Durchschnitt |
| **Gamification** | **❌ Nein** | $0 | — Rein algorithmisch |
| **Export (PDF/Anki)** | **❌ Nein** | $0 | — Template-basiert |
| **Streak/Level/XP** | **❌ Nein** | $0 | — DB Queries |
| **Lernstatistiken** | **❌ Nein** | $0 | — Aggregation |

### 4.2 Caching-Strategie

```
Layer 1: Dokument-Level Caching
- Zusammenfassung: 1x generieren → in documents.summary speichern
- Glossar: 1x extrahieren → in glossary_terms speichern
- Quiz-Fragen: Generierte Fragen bleiben in quiz_questions → kein erneuter AI-Call
- Flashcards: Einmal generiert → persistent in flashcards Tabelle

Layer 2: Embedding Caching
- Dokument-Chunks werden einmalig embedded (bei Upload)
- Chat-Queries: Häufige Fragen cachen (Hash des Query-Embeddings → cached response)
- Implementierung: Neue Tabelle query_cache (query_hash, response, created_at, expires_at)

Layer 3: API Response Caching
- Next.js Route Handler Caching für GET-Endpoints
- Revalidate-on-demand bei Datenänderungen
- Static generation für Landing Page und Preisseite

Geschätzte Ersparnis: 60-80% weniger API-Calls durch Caching
```

### 4.3 Modell-Strategie

| Use Case | Modell | Grund |
|----------|--------|-------|
| Quiz-Generierung | GPT-4o-mini | Günstig, strukturierter Output gut genug |
| Flashcard-Generierung | GPT-4o-mini | Einfache Extraktion, mini reicht |
| RAG-Chat | GPT-4o-mini (Free/Basis) / Claude Sonnet (Pro) | Sonnet für tiefere Erklärungen als Premium-Perk |
| Zusammenfassung | GPT-4o-mini | Einmalig, gecacht |
| Klausur-Generierung | GPT-4o-mini | Wiederverwendet existierende Fragen + generiert neue |
| Glossar | GPT-4o-mini | Einfache Extraktion |
| Lernplan | GPT-4o-mini | Einmalig, gecacht |
| Mündliche Prüfung | Claude Sonnet (Pro only) | Braucht besseres Reasoning für natürliche Konversation |
| Embeddings | text-embedding-3-small | $0.02/1M Tokens, ausreichende Qualität |

### 4.4 Multi-Output Generation (Phase E3)

```
Statt 3 separate API-Calls:
  1. Quiz generieren (2k in + 800 out)
  2. Flashcards generieren (2k in + 1k out)
  3. Summary generieren (2k in + 400 out)
  = 6k Input + 2.2k Output = ~$0.0022

Ein kombinierter Call:
  "Generiere aus diesem Text: 10 Quiz-Fragen, 20 Flashcards, 1 Zusammenfassung"
  = 2k Input + 2.4k Output = ~$0.0006

Ersparnis: 73% weniger Kosten, 66% weniger Latenz
Einschränkung: Output-Qualität testen — bei Qualitätsverlust besser 2 Calls
```

### 4.5 Kosten pro User (Worst Case / Best Case)

| Szenario | Free User | Basis User | Pro User |
|----------|-----------|------------|----------|
| API-Calls/Monat | 20 | 150 | 500 (typisch) |
| Kosten/Monat (ohne Cache) | $0.01 | $0.08 | $0.25 |
| Kosten/Monat (mit Cache) | $0.003 | $0.02 | $0.08 |
| Revenue/Monat | €0 | €9,99 | €19,99 |
| **Marge** | — (Akquisition) | **99,8%** | **99,6%** |

> Fazit: Selbst bei aggressiver Nutzung bleiben API-Kosten unter 1% des Revenues. Die echten Kosten sind Supabase (ab $25/mo) und Vercel (ab $20/mo) — nicht die AI APIs.

---

## 5. KPIs und Erfolgsmetriken

### 5.1 North Star Metrics

| Metrik | Definition | Ziel (6 Monate) |
|--------|-----------|-----------------|
| **WAU** (Weekly Active Users) | Unique Users die 1+ Aktion/Woche ausführen | 800 |
| **Retention D7** | % der User die nach 7 Tagen zurückkehren | >40% |
| **Paid Conversion** | % Free → Basis/Pro innerhalb 30 Tagen | >8% |
| **MRR** | Monthly Recurring Revenue | €5.000 |

### 5.2 Feature-spezifische KPIs

| Feature | KPI | Ziel | Messung |
|---------|-----|------|---------|
| **Onboarding** | Completion Rate | >70% | `profiles.onboarding_completed` / new signups |
| **Dokument-Upload** | Upload-to-Ready Rate | >95% | `documents.status = 'ready'` / total uploads |
| **Quiz** | Quiz-Completion Rate | >80% | `quiz_attempts.completed_at IS NOT NULL` / started |
| **Quiz** | Ø Score-Verbesserung | +15% | Score-Delta zwischen 1. und 3. Versuch am selben Thema |
| **Flashcards** | Daily Review Adherence | >60% | Tage mit Review / Tage mit fälligen Karten |
| **Spaced Repetition** | Retention Rate (Karten) | >85% | quality ≥ 3 / total reviews |
| **Chat** | Messages pro Session | >3 | Ø chat_messages pro course_id pro Session |
| **Gamification** | Streak ≥ 3 Tage | >30% der WAU | `profiles.current_streak >= 3` / WAU |
| **Freemium** | Limit-Hit Rate (Free) | ~25% | Users die 20/20 erreichen / Free Users |
| **Upgrade** | Upgrade nach Limit-Hit | >15% | Upgrades innerhalb 7d nach Limit / Limit-Hits |
| **Zusammenfassung** | Generierungsrate | >50% der Docs | Docs mit Summary / Docs total |
| **Klausur-Simulator** | Nutzung (Basis+Pro) | >40% | Users die ≥1 Klausur simuliert / Basis+Pro Users |
| **Churn** | Monatliche Kündigungsrate | <5% | Abgekündigte Abos / aktive Abos |

### 5.3 Kosten-KPIs

| Metrik | Definition | Ziel |
|--------|-----------|------|
| **COGS pro User** | API + Infra Kosten / aktive User | <€0,10/mo |
| **CAC** | Kosten pro Neuregistrierung | <€5 |
| **LTV** | Lifetime Value (Ø Revenue pro User) | >€50 |
| **LTV:CAC Ratio** | | >10:1 |
| **Gross Margin** | (Revenue - API Kosten) / Revenue | >95% |

### 5.4 Tracking-Implementierung

```
Bereits vorhanden:
- study_sessions Tabelle → Aktivitäts-Tracking (Quiz, Flashcard, Chat, Upload)
- quiz_attempts → Quiz-Scores und Completion
- flashcard_reviews → SRS-Metriken
- profiles → XP, Level, Streak, Generations Used, Tier

Noch hinzufügen (Phase D/E):
- Einfaches Event-Tracking via study_sessions erweitern:
  - activity_type: 'page_view', 'upgrade_prompt_shown', 'upgrade_clicked', 'limit_reached'
  - metadata: { page, action, tier_from, tier_to }
- Kein externes Analytics-Tool nötig für MVP (DSGVO-freundlich!)
- Später: Plausible Analytics (EU-hosted, DSGVO-konform, €9/mo)
```

---

## Zusammenfassung: Was als Nächstes tun?

### ~~Phase C~~ ✅ Abgeschlossen (2026-02-12)

### Jetzt (Phase D) — 2-3 Wochen
1. DSGVO-Seiten (Impressum, Datenschutz) — **rechtlich Pflicht**
2. Landing Page designen und bauen
3. Zusammenfassungen implementieren (schneller Win)
4. Schwächenanalyse (kein AI nötig)
5. Quiz-Fragetyp-Auswahl (UX-Verbesserung)

### Monetarisierung (Phase E) — 3-4 Wochen
1. Stripe-Integration (Checkout + Webhooks)
2. Multi-Output Generation (Kostenoptimierung)
3. Klausur-Simulator (Killer-Feature)
4. Glossar + Export + Notenprognose

### Deployment (nach Phase E)
1. Vercel Deployment + Produktions-Test

### Wachstum (Phase F) — Ongoing
1. PWA für Mobile
2. Gruppenlernen (virales Wachstum)
3. Mündliche Prüfung Coach
4. LMS-Integration

### Multi-Input (Phase G) — Zukunft

> **Ziel**: Mehr Input-Formate unterstützen — Studierende sollen nicht nur PDFs, sondern auch Sprachmemos und YouTube-Videos als Lernmaterial verwenden können.

#### G1. Sprachmemo-Upload + Transkription
**Konzept**: User nimmt Vorlesung auf (Handy) → lädt Sprachmemo hoch → App transkribiert + erstellt strukturierte Zusammenfassung → Material kann für Quiz, Flashcards, Chat genutzt werden.

```
Technologie:
- Upload: MP3, M4A, WAV, OGG via Supabase Storage
- Transkription: OpenAI Whisper API (speech-to-text)
- Zusammenfassung: GPT-4o-mini strukturiert den transkribierten Text
- Danach: Standard-Pipeline (Chunking → Embedding → pgvector)

Kosten-Analyse:
- Whisper API: $0.006/min
- 45-min Vorlesung: ~$0.27 Transkription + ~$0.001 Summary
- 90-min Vorlesung: ~$0.54 Transkription + ~$0.002 Summary
→ Sehr vertretbar, hoher wahrgenommener Wert
→ Nur für Basis + Pro (wegen Kosten)

Use Cases:
- Vorlesungsmitschnitt → Zusammenfassung + Quiz
- Mündliche Notizen → strukturierte Lernkarten
- Lerngruppen-Gespräch → Protokoll + Flashcards

DB-Änderungen:
- documents.file_type: 'mp3' | 'mp4a' | 'wav' | 'ogg' hinzufügen
- Neues Feld: documents.transcription_text (text, nullable)
- Processing-Pipeline erweitern: Audio → Whisper → Text → Chunking → Embedding
```

#### G2. YouTube-Link Transkription + Zusammenfassung
**Konzept**: User gibt YouTube-URL ein → App extrahiert Transkript → erstellt strukturierte Zusammenfassung → Material wird wie ein Dokument behandelt.

```
Technologie:
- Transkript-Extraktion: youtube-transcript-api (npm) oder YouTube Data API
- Fallback: Whisper API wenn keine Captions vorhanden
- Zusammenfassung: GPT-4o-mini
- Danach: Standard-Pipeline (Chunking → Embedding → pgvector)

Kosten-Analyse:
- YouTube Captions: $0 (kostenlos via API)
- Whisper Fallback: $0.006/min (nur wenn keine Captions)
- Summary: ~$0.001
→ Extrem günstig für Videos mit Captions (die meisten Vorlesungsvideos)

Use Cases:
- YouTube-Vorlesungen (Khan Academy, Uni-Channels) → Quiz + Flashcards
- Erklärvideos → Zusammenfassung + Chat
- Playlist ganzer Kurs → alle Videos als Dokumente

DB-Änderungen:
- documents.file_type: 'youtube' hinzufügen
- documents.source_url (text, nullable) für YouTube-URL
- Neues UI: URL-Input statt File-Upload (Tab oder Toggle)

Implementierung:
1. YouTube-URL parsen → Video-ID extrahieren
2. Captions abrufen (DE bevorzugt, EN als Fallback, auto-generated OK)
3. Captions als Text speichern → Standard-Chunking-Pipeline
4. Bei fehlenden Captions: Audio-Track herunterladen → Whisper
```

#### G-Reihenfolge
1. G2 (YouTube) — Einfacher Start, meist kostenloses Captions-API
2. G1 (Sprachmemo) — Whisper-Integration, komplexerer Upload-Flow

---

> **Kernprinzip**: Maximaler Wert bei minimalen API-Kosten. Algorithmische Features (SRS, Schwächenanalyse, Notenprognose, Gamification, Export) kosten $0 und liefern enormen Nutzen. AI-Features werden einmalig generiert und gecacht. Die Marge bleibt bei >95%.
