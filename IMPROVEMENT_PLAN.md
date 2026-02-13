# StudyApp — Verbesserungs- & Feature-Plan

> Erstellt: 2026-02-13 | Status: Bereit zur Implementierung | Kontext: Nach Phase E, vor Phase F

## Context

Die App ist feature-complete (Phasen 1-3, A-E). Vor Phase F (Stripe/Deployment) soll die bestehende App poliert, UX-Probleme behoben und der wahrgenommene Wert maximiert werden. Diese Analyse basiert auf einer tiefgehenden Codebasis-Exploration aller Komponenten, API-Routes und Libraries.

---

## A) Bestehende Features verbessern

### A1. Sidebar: Secondary Nav Active State
**Problem:** Zeile 191 in `app-sidebar.tsx` — `secondaryNavItems` haben kein `isActive` prop. User sieht nicht, wo er ist.
**Fix:** `isActive={pathname === item.href || pathname.startsWith(item.href + "/")}` hinzufügen (wie Primary Nav Zeile 172).
**Aufwand:** Klein (5 min) | **Dateien:** `src/components/dashboard/app-sidebar.tsx`

### A2. Chat: Copy-to-Clipboard
**Problem:** AI-Antworten im Chat können nicht kopiert werden. Studenten wollen Erklärungen in Notizen einfügen.
**Fix:** Kleiner Copy-Button (hover) auf jeder Assistant-Message mit `navigator.clipboard.writeText()`.
**Aufwand:** Klein (30 min) | **Dateien:** `src/app/(dashboard)/dashboard/courses/[courseId]/chat/page.tsx`

### A3. Chat: Bestätigungsdialog für "Verlauf löschen"
**Problem:** `clearHistory()` löscht alles sofort ohne Bestätigung (Zeile 130-144). Destruktive Aktion ohne Warnung.
**Fix:** `AlertDialog` von shadcn/ui wrappen.
**Aufwand:** Klein (20 min) | **Dateien:** Chat-Seite

### A4. Freemium: Race Condition fixen
**Problem:** `incrementUsage()` in `freemium.ts` macht Read-then-Write. Zwei parallele Requests können das Limit umgehen.
**Fix:** Supabase RPC mit `SET ai_generations_used = ai_generations_used + 1 WHERE ai_generations_used < limit` (atomic).
**Aufwand:** Klein-Mittel (1h) | **Dateien:** `src/lib/freemium.ts`, neue Migration `00006_increment_usage_rpc.sql`

### A5. Chat: Freemium vor Streaming prüfen
**Problem:** `incrementUsage()` wird in `onFinish` Callback aufgerufen (nach Stream). User bekommt eine extra Generation.
**Fix:** Increment vor `streamText()` verschieben.
**Aufwand:** Klein (30 min) | **Dateien:** `src/app/api/chat/route.ts`

### A6. Deduplizierung: `scoreToGrade`
**Problem:** Identische Noten-Mapping-Funktion in `analytics.ts` (Zeile 103) und `exam/submit/route.ts` (Zeile 7).
**Fix:** Neue Datei `src/lib/grading.ts`, Import in beiden Stellen.
**Aufwand:** Klein (15 min) | **Dateien:** Neue `src/lib/grading.ts`, `src/lib/analytics.ts`, `src/app/api/exam/submit/route.ts`

### A7. Deduplizierung: `LEVEL_THRESHOLDS`
**Problem:** Identisches Array in `gamification.ts` (Zeile 16) und `app-sidebar.tsx` (Zeile 111).
**Fix:** Aus `gamification.ts` exportieren, in Sidebar importieren.
**Aufwand:** Klein (15 min) | **Dateien:** `src/lib/gamification.ts`, `src/components/dashboard/app-sidebar.tsx`

### A8. Gamification API: N+1 Queries reduzieren
**Problem:** `POST /api/gamification` führt 5-6 separate COUNT-Queries pro Activity aus (~200-400ms overhead).
**Fix:** Supabase RPC `get_user_stats(user_id)` die alles in einer Query zurückgibt.
**Aufwand:** Mittel (2-3h) | **Dateien:** Neue Migration, `src/app/api/gamification/route.ts`

### A9. Onboarding: Skip-Button
**Problem:** Wizard blockiert Navigation komplett. User mit `onboarding_completed=false` sind gefangen.
**Fix:** "Überspringen" Button im Dialog-Header, setzt `onboarding_completed=true`.
**Aufwand:** Klein (30 min) | **Dateien:** `src/components/onboarding/onboarding-wizard.tsx`, `onboarding-check.tsx`

### A10. Document Processing: Outer Try-Catch
**Problem:** `POST /api/documents/process` hat kein try-catch um den gesamten Handler. Ungültiges JSON oder Auth-Fehler geben generisches 500.
**Fix:** Gesamten POST-Handler wrappen.
**Aufwand:** Klein (15 min) | **Dateien:** `src/app/api/documents/process/route.ts`

---

## B) Dashboard & Navigation

### B1. Loading-Skeletons für alle Dashboard-Routes
**Problem:** Kein einziges `loading.tsx` existiert. Navigation zeigt leeren Bildschirm bis Server-Component resolved.
**Fix:** `loading.tsx` mit Skeleton-UI für alle Hauptrouten.
**Aufwand:** Mittel (2-3h) | **Dateien (neu):**
- `src/app/(dashboard)/dashboard/loading.tsx`
- `src/app/(dashboard)/dashboard/courses/loading.tsx`
- `src/app/(dashboard)/dashboard/courses/[courseId]/loading.tsx`
- `src/app/(dashboard)/dashboard/reviews/loading.tsx`
- `src/app/(dashboard)/dashboard/achievements/loading.tsx`
- `src/app/(dashboard)/dashboard/study-plan/loading.tsx`

### B2. Error Boundaries
**Problem:** Kein `error.tsx` oder `global-error.tsx` existiert. Fehler crashen die ganze Seite ohne Recovery.
**Fix:** Fehlerseiten mit "Erneut versuchen" Button.
**Aufwand:** Klein (1h) | **Dateien (neu):**
- `src/app/global-error.tsx`
- `src/app/(dashboard)/dashboard/error.tsx`
- `src/app/(dashboard)/dashboard/courses/[courseId]/error.tsx`

### B3. Fällige-Karten-Badge in Sidebar
**Problem:** "Wiederholungen" Link zeigt keine Zahl fälliger Flashcards. User sieht keinen Handlungsbedarf.
**Fix:** Due-Count im Layout fetchen, an Sidebar als Prop übergeben, als Badge rendern.
**Aufwand:** Klein (45 min) | **Dateien:** `src/app/(dashboard)/layout.tsx`, `src/components/dashboard/app-sidebar.tsx`

### B4. Tier-Badge in Sidebar Footer
**Problem:** User sehen nicht, ob sie Free oder Pro sind. `gamification.tier` wird schon als Prop übergeben.
**Fix:** `Badge` Komponente neben Display-Name im Footer (Zeile 229).
**Aufwand:** Klein (15 min) | **Dateien:** `src/components/dashboard/app-sidebar.tsx`

### B5. Dashboard: "Alle anzeigen" Links
**Problem:** Letzte Aktivität (5 Items), Achievements (3 Items), Reviews — keine "mehr anzeigen" Option.
**Fix:** `<Link>` zu jeweiligen Vollseiten im `CardHeader`.
**Aufwand:** Klein (30 min) | **Dateien:** `src/app/(dashboard)/dashboard/page.tsx`

### B6. Kurs-Suche/Filter/Sortierung
**Problem:** Kursseite hat keine Suche, kein Filter, keine Sortierung. Bei 5+ Kursen unübersichtlich.
**Fix:** Client-Component mit Search-Input + Sort-Dropdown über der Kurs-Grid.
**Aufwand:** Mittel (2h) | **Dateien:** Neue `src/components/course/course-filters.tsx`, `src/app/(dashboard)/dashboard/courses/page.tsx`

### B7. Kursdetail: Tab-Auswahl in URL persistieren
**Problem:** `Tabs defaultValue="documents"` (Zeile 177 in course-detail.tsx). Tab-Auswahl geht bei Navigation verloren.
**Fix:** `useSearchParams` + `router.replace` um `?tab=quizzes` in URL zu syncen.
**Aufwand:** Klein (30 min) | **Dateien:** `src/components/course/course-detail.tsx`

---

## C) Neue Features

### C1. Settings-Seite (Details siehe Abschnitt E)
**Problem:** Sidebar verlinkt auf `/dashboard/settings` → 404. Jeder User sieht den kaputten Link.
**Aufwand:** Groß (4-6h) | **Impact:** Hoch

### C2. Dark Mode
**Problem:** CSS hat bereits `.dark` Variablen in `globals.css`. Fehlt: ThemeProvider + Toggle.
**Fix:** `next-themes` installieren, ThemeProvider in root Layout, Toggle in Settings + optional Sidebar.
**Aufwand:** Mittel (1.5h) | **Dateien:** Neue `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `src/app/layout.tsx`

### C3. Dokument-Löschung
**Problem:** User können keine Dokumente entfernen. Falsche/veraltete Uploads bleiben für immer.
**Fix:** Delete-Button pro Dokument mit Bestätigungsdialog. Löscht Storage-Datei + DB-Record + Chunks.
**Aufwand:** Mittel (1.5h) | **Dateien:** Neue `src/components/document/delete-document-dialog.tsx`, `src/components/course/course-detail.tsx`

### C4. Manuelle Flashcard-Erstellung
**Problem:** Flashcards können nur per AI generiert werden. Wenn Generierungen aufgebraucht → keine neuen Karten.
**Fix:** "Eigene Karten erstellen" Button im Flashcards-Tab. Formular für Front/Back.
**Aufwand:** Mittel (3h) | **Dateien:** Neue `src/components/flashcard/flashcard-editor.tsx`, `course-detail.tsx`

### C5. Quiz: Navigations-Pills
**Problem:** Klausur-Simulator hat Navigations-Pills für Fragensprünge. Quiz-Modus nicht — nur linear.
**Fix:** Gleiche Pill-UI wie Exam in Quiz-Play einbauen.
**Aufwand:** Klein (1h) | **Dateien:** `src/app/(dashboard)/dashboard/courses/[courseId]/quiz/[quizId]/page.tsx`

### C6. Quiz: Review-Modus für vergangene Versuche
**Problem:** Nach Quiz-Ende nur Summary sichtbar. User kann einzelne Fragen nicht nochmal im Detail ansehen.
**Fix:** "Nochmal ansehen" Button → Read-only Replay mit eigenen Antworten + korrekten Antworten.
**Aufwand:** Mittel (2h) | **Dateien:** Neue Review-Page, `course-detail.tsx`

### C7. Copy-to-Clipboard für Summaries & Glossar
**Problem:** Zusammenfassungen und Glossar-Begriffe können nicht kopiert werden.
**Fix:** Copy-Buttons analog zum Chat (A2).
**Aufwand:** Klein (30 min) | **Dateien:** `src/components/document/summary-view.tsx`, `src/components/document/glossary-view.tsx`

---

## D) Retention & Burggraben (Moat)

### D1. Level-Up Celebration (Confetti)
**Problem:** Level-Ups gehen unter — nur XP-Zahl ändert sich. Kein emotionaler Moment.
**Fix:** `canvas-confetti` (6KB) bei Level-Up triggern + celebratory Toast/Modal.
**Aufwand:** Klein (1h) | **Dateien:** `src/lib/gamification-client.ts`, optional neue `src/components/gamification/level-up-celebration.tsx`

### D2. Tägliches Lernziel
**Problem:** Kein Commitment-Device. User haben kein konkretes Tagesziel.
**Fix:** Einstellbares XP-Ziel (50/100/200) in Settings. Progress-Ring in Sidebar + Dashboard.
**Aufwand:** Mittel (2-3h) | **Dateien:** Neue Migration, `app-sidebar.tsx`, Settings-Seite, Dashboard

### D3. Achievement-Celebration-Modal
**Problem:** Achievement-Unlocks sind nur Toasts — flüchtig und leicht zu übersehen.
**Fix:** Dediziertes Modal mit Icon, Name, XP-Reward bei Erstfreischaltung.
**Aufwand:** Klein (1h) | **Dateien:** `src/lib/gamification-client.ts`, `src/components/gamification/achievement-toast.tsx`

### D4. Streak-Freeze (Pro only)
**Problem:** Langer Streak geht bei einem verpassten Tag verloren → Frustration → App-Aufgabe.
**Fix:** Pro-User können 1x/Woche Streak einfrieren. Neue Spalte `streak_freezes_available`.
**Aufwand:** Mittel (1.5h) | **Dateien:** Migration, `src/lib/gamification.ts`, `src/app/api/gamification/route.ts`

### D5. Mehr Achievements (12 → 20+)
**Problem:** 12 Achievements sind für aktive User schnell freigeschaltet. Keine langfristigen Ziele.
**Fix:** 8+ neue Achievements: Erste Klausur bestanden, 5 Klausuren, Glossar-Meister, Export-Champion, 50/100 Reviews, 30-Tage-Streak, etc.
**Aufwand:** Mittel (2h) | **Dateien:** Neue Migration (INSERT), `src/lib/gamification.ts`

### D6. Weekly Progress Email (Konzept/Zukunft)
**Problem:** Kein Re-Engagement-Kanal außerhalb der App.
**Konzept:** Wöchentliche Email: Streak-Status, XP, fällige Karten, Motivation. Benötigt Email-Provider (Resend), Cron-Job.
**Aufwand:** Groß (8h+) | **Priorität:** Niedrig (nach Deployment)

---

## E) Settings-Seite — Vollständige Spezifikation

**Route:** `/dashboard/settings` → `src/app/(dashboard)/dashboard/settings/page.tsx`

### Sections (shadcn Cards, vertikaler Stack):

1. **Profil** — Display-Name editieren (Input + Save), Email anzeigen (read-only), Tier-Badge
2. **Erscheinungsbild** — Dark/Light/System Theme-Toggle (`next-themes`)
3. **Lernziele** — Tägliches XP-Ziel Selektor (50/100/200)
4. **Konto-Sicherheit** — Passwort ändern (aktuell + neu + bestätigen) via `supabase.auth.updateUser({ password })`
5. **Abonnement** — Aktueller Tier, Nutzungszähler (X/20), Reset-Datum, Upgrade-Button (Platzhalter für Stripe)
6. **Datenexport** — "Alle Daten exportieren" Button (DSGVO Art. 20), JSON-Download
7. **Konto löschen** — Danger Zone (roter Rahmen). Bestätigung durch Eingabe von "LÖSCHEN". Server-Action für Löschung.

**Dateien:**
- `src/app/(dashboard)/dashboard/settings/page.tsx` (Server-Component)
- `src/components/settings/profile-section.tsx`
- `src/components/settings/appearance-section.tsx`
- `src/components/settings/security-section.tsx`
- `src/components/settings/subscription-section.tsx`
- `src/components/settings/danger-section.tsx`
- `src/app/api/settings/delete-account/route.ts`

---

## F) Code-Qualität & Performance

### F1. Zod-Validierung auf API Routes
**Problem:** API-Routes prüfen nur `if (!courseId)`. Kein Typ-Check, kein Range-Check. `questionCount=-100` wird akzeptiert.
**Fix:** Zod-Schemas für alle POST-Handler: `.uuid()`, `.min()`, `.max()`, `.enum()`.
**Aufwand:** Mittel (2-3h) | **Dateien:** Alle 14 API-Routes in `src/app/api/`

### F2. Hardcoded Context-Limits extrahieren
**Problem:** Magische Zahlen (12000, 15000) über 5+ Routes verstreut.
**Fix:** `src/lib/ai/config.ts` mit zentralen Limits.
**Aufwand:** Klein (30 min) | **Dateien:** Neue Config-Datei, alle AI-Routes

### F3. Flashcard-Reviews Pagination
**Problem:** `/api/flashcards/due` fetcht ALLE Reviews ohne Limit. Bei 10K Karten → OOM-Risk.
**Fix:** `.limit(100)` + Distinct-on-flashcard_id.
**Aufwand:** Klein (30 min) | **Dateien:** `src/app/api/flashcards/due/route.ts`

### F4. Accessibility
**Fix:** (a) `aria-label` auf Icon-only Buttons (Export-Buttons etc.), (b) `role="status"` auf Spinner, (c) Skip-to-Content Link im Layout, (d) Sichtbare Form-Labels.
**Aufwand:** Mittel (2h) | **Dateien:** Multiple Components

### F5. Rate Limiting
**Problem:** Kein Per-Minute/Per-Hour Limit auf teure AI-Routes. Freemium-Limit ist pro Monat.
**Fix:** Simple Sliding-Window Rate-Limiter (in-memory) in `src/lib/rate-limit.ts`.
**Aufwand:** Mittel (2h) | **Dateien:** Neue `src/lib/rate-limit.ts`, alle AI-Routes

---

## Priorisierter Implementierungsplan

### 1. Quick Wins (Hoher Impact, Niedriger Aufwand) — Sofort umsetzen (~6h)

| # | Item | Ref | Aufwand |
|---|------|-----|---------|
| 1 | Sidebar Secondary Nav Active State | A1 | 5 min |
| 2 | Tier-Badge in Sidebar | B4 | 15 min |
| 3 | Deduplizierung scoreToGrade | A6 | 15 min |
| 4 | Deduplizierung LEVEL_THRESHOLDS | A7 | 15 min |
| 5 | Document Processing try-catch | A10 | 15 min |
| 6 | Chat Copy-to-Clipboard | A2 | 30 min |
| 7 | Chat Clear-Bestätigung | A3 | 20 min |
| 8 | Onboarding Skip-Button | A9 | 30 min |
| 9 | Freemium Race Condition | A4 | 1h |
| 10 | Chat Freemium Pre-validate | A5 | 30 min |
| 11 | Copy für Summaries/Glossar | C7 | 30 min |
| 12 | Tab-URL-Persistence | B7 | 30 min |
| 13 | Context-Limits extrahieren | F2 | 30 min |
| 14 | Dashboard "Alle anzeigen" Links | B5 | 30 min |

### 2. Wichtig (Hoher Impact, Mittlerer Aufwand) — Als Nächstes (~22h)

| # | Item | Ref | Aufwand |
|---|------|-----|---------|
| 1 | **Settings-Seite** | C1/E | 4-6h |
| 2 | **Dark Mode** | C2 | 1.5h |
| 3 | **Loading Skeletons** | B1 | 2-3h |
| 4 | **Error Boundaries** | B2 | 1h |
| 5 | Fällige-Karten-Badge in Sidebar | B3 | 45 min |
| 6 | Level-Up Celebration (Confetti) | D1 | 1h |
| 7 | Dokument-Löschung | C3 | 1.5h |
| 8 | Kurs-Suche/Filter | B6 | 2h |
| 9 | Gamification N+1 Query Fix | A8 | 2-3h |
| 10 | Zod Validation auf API Routes | F1 | 2-3h |
| 11 | Quiz Navigations-Pills | C5 | 1h |
| 12 | Achievement Celebration Modal | D3 | 1h |
| 13 | Rate Limiting | F5 | 2h |

### 3. Nice to Have (Mittlerer Impact) — Wenn Zeit bleibt (~18h)

| # | Item | Ref | Aufwand |
|---|------|-----|---------|
| 1 | Manuelle Flashcard-Erstellung | C4 | 3h |
| 2 | Quiz Review-Modus | C6 | 2h |
| 3 | Tägliches Lernziel | D2 | 2-3h |
| 4 | Streak-Freeze (Pro) | D4 | 1.5h |
| 5 | Mehr Achievements (20+) | D5 | 2h |
| 6 | Flashcard-Reviews Pagination | F3 | 30 min |
| 7 | Accessibility Improvements | F4 | 2h |
| 8 | Weekly Progress Email | D6 | 8h+ |

---

## Verifikation

Nach Implementierung der Quick Wins + Wichtig:
1. `npm run build` — muss fehlerfrei durchlaufen
2. `npm run lint` — keine neuen Warnungen
3. Settings-Seite: Profil ändern, Passwort ändern, Theme wechseln, Daten exportieren
4. Dark Mode: Toggle in Settings → gesamte App wechselt Theme korrekt
5. Loading States: Langsame Verbindung simulieren (DevTools Network Throttling) → Skeletons erscheinen
6. Error Boundaries: `throw new Error()` temporär einfügen → Fehlerseite mit Retry-Button
7. Sidebar: Alle Nav-Items highlighten korrekt, Badge zeigt fällige Karten, Tier sichtbar
8. Freemium: Zwei parallele Quiz-Generierungen → Limit wird korrekt enforced
9. Chat: Copy-Button funktioniert, Clear zeigt Bestätigung, Freemium wird vor Stream geprüft
10. Mobile: Alle neuen Features auf 375px Viewport testen
