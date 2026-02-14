# StudyApp — Verbesserungs- & Feature-Plan

> Erstellt: 2026-02-13 | Aktualisiert: 2026-02-14 | Status: Phasen 1-3 abgeschlossen (8/21) | Kontext: Nach Quick Wins + Wichtig, neue Feature-Roadmap

## Context

Die App ist feature-complete (Phasen 1-3, A-E). Quick Wins (14/14) und Wichtig-Items (13/13) aus der vorherigen Version dieses Plans sind abgeschlossen. Vor Phase F (Stripe/Deployment) werden nun neue Features und Verbesserungen nach neuer Prioritätenliste implementiert.

---

## Abgeschlossen

### Quick Wins (14/14) ✅
- A1 Sidebar Secondary Nav Active State
- B4 Tier-Badge in Sidebar
- A6 Deduplizierung scoreToGrade → `src/lib/grading.ts`
- A7 Deduplizierung LEVEL_THRESHOLDS
- A10 Document Processing try-catch
- A2 Chat Copy-to-Clipboard
- A3 Chat Clear-Bestätigung (AlertDialog)
- A9 Onboarding Skip-Button
- A4 Freemium Race Condition → `00006_increment_usage_rpc.sql`
- A5 Chat Freemium Pre-validate
- C7 Copy für Summaries/Glossar
- B7 Tab-URL-Persistence
- F2 Context-Limits extrahieren → `src/lib/ai/config.ts`
- B5 Dashboard "Alle anzeigen" Links

### Wichtig (13/13) ✅
- C1/E Settings-Seite (Profil, Sicherheit, Abonnement, Datenexport, Konto löschen)
- C2 Dark Mode (next-themes, ThemeProvider, Toggle)
- B1 Loading Skeletons (alle Dashboard-Routes)
- B2 Error Boundaries (global-error, dashboard error, course error)
- B3 Fällige-Karten-Badge in Sidebar
- D1 Level-Up Celebration (canvas-confetti)
- C3 Dokument-Löschung
- B6 Kurs-Suche/Filter
- A8 Gamification N+1 Query Fix
- F1 Zod Validation auf API Routes
- C5 Quiz Navigations-Pills
- D3 Achievement Celebration Modal
- F5 Rate Limiting

---

## Neue Prioritätenliste (21 Features)

### Phase 1: Kritische Bugfixes

#### 1.1 Markdown- & LaTeX-Rendering im KI-Chat
**Problem:** Im KI-Chat werden Markdown-Formatierungen als Rohtext angezeigt. `**Fettschrift**`, `### Überschriften` und LaTeX wie `\( s_t \)` werden nicht gerendert.
**Lösung:**
- `react-markdown` + `rehype-katex` + `remark-math` + `katex` integrieren
- Inline-Math (`\( ... \)`, `$ ... $`) und Block-Math (`\[ ... \]`, `$$ ... $$`) rendern
- Auch auf Quiz-Erklärungen und Flashcard-Inhalte anwenden
- Dark-Theme-kompatibles Styling (helle Schrift, dunkle Code-Blöcke)
**Dateien:** Chat-Page, Quiz-Page, Flashcard-Komponenten, KaTeX CSS Import
**Status:** ✅ Erledigt — `src/components/ui/markdown-renderer.tsx`, react-markdown + rehype-katex + remark-math

#### 1.2 Mobile Navigation (Hamburger-Menü)
**Problem:** Unter ~1024px verschwindet die Sidebar komplett. Kein Zugang zu Navigation auf Mobile.
**Lösung:**
- shadcn/ui Sidebar hat built-in Mobile-Support (Sheet)
- SidebarTrigger Button im Mobile-Header hinzugefügt
- Auto-Close nach Seitenwechsel (built-in)
**Dateien:** `src/app/(dashboard)/layout.tsx`
**Status:** ✅ Erledigt

---

### Phase 2: Globaler KI-Lernassistent

#### 2.1 + 2.2 Floating Action Button + Globales KI-Chat-Panel
**Beschreibung:** Persistenter FAB (unten rechts, 56x56px, Akzentfarbe) auf JEDER Seite. Öffnet Chat-Panel (400-450px rechts, Fullscreen auf Mobile).
**Features:**
- Persistent über Seitenwechsel (React Context/Zustand)
- Kurs-Kontext-Erkennung (automatisch auf Kursseiten, kursübergreifend auf Dashboard)
- Manueller Kurs-Kontext-Wechsel via Dropdown
- Quellenangaben mit klickbaren Links zum Kurs
- Schnellaktionen nach KI-Antwort: "Quiz erstellen", "Flashcard erstellen", "Einfacher erklären", "Mehr Details"
- Volles Markdown/LaTeX-Rendering
- Freemium-Kontingent wird verbraucht
**Dateien:** `src/lib/stores/global-chat-store.ts`, `src/components/global-chat/chat-fab.tsx`, `src/components/global-chat/chat-panel.tsx`, `src/app/api/courses/route.ts`, `src/app/api/chat/route.ts`
**Status:** ✅ Erledigt

---

### Phase 3: Quiz- & Flashcard-Verbesserungen

#### 3.1 Quiz Review-Modus ("Nur Fehler wiederholen")
**Beschreibung:** Nach Quiz-Ende Button "Fehler wiederholen" → neue Session nur mit falschen Fragen. Hinweis "Review-Modus: X von Y falsch". Ergebnisse fließen in Statistiken.
**Status:** ✅ Erledigt — Quiz-Seite mit Review-Mode-Banner und Fehler-Filter

#### 3.2 KI-Tiefenerklärung bei Quiz-Fehlern
**Beschreibung:** Button "Ausführlich erklären" bei falschen Antworten. KI generiert: Warum richtig, warum falsch, Praxisbeispiel, Merkhilfe. Volles Markdown/LaTeX. Kostet 1 KI-Generierung.
**Status:** ✅ Erledigt — `src/app/api/quiz/explain/route.ts`, freemium-geprüft + rate-limited

#### 3.3 Manuelle Flashcard-Erstellung + Bearbeiten
**Beschreibung:** "Eigene Flashcard erstellen" Button → Dialog mit Frage/Antwort. Edit-Icon auf jeder Karte in Lern-Session → Edit-Modal. Manuell erstellte Karten in SM-2 enthalten.
**Status:** ✅ Erledigt — `src/components/flashcard/flashcard-editor.tsx` (CreateFlashcardDialog + EditFlashcardDialog), `src/app/api/flashcards/manual/route.ts`

#### 3.4 Flashcard-Umkehrung (Antwort → Frage)
**Beschreibung:** Toggle "Umgekehrt lernen" in Flashcard-Session. Zeigt zuerst Antwort, Nutzer errät Frage. Labels tauschen. Session-basiert.
**Status:** ✅ Erledigt — ArrowLeftRight Toggle in Lern-Page + Review-Session

#### 3.5 Flashcard-Reviews Pagination
**Beschreibung:** Nach je 10 Karten Zwischenübersicht mit Fortschritt. "Weiter lernen" oder "Session beenden". End-Summary mit Verteilung (Nochmal/Schwer/Gut/Einfach) + XP.
**Status:** ✅ Erledigt — Batch-Break alle 10 Karten mit Statistik-Grid + Rating-Verteilung im End-Summary

---

### Phase 4: Gamification & Engagement

#### 4.1 Tägliches Lernziel
**Beschreibung:** Konfigurierbares Tagesziel (Locker/Normal/Intensiv/Custom). Dashboard-Karte mit Fortschrittsring. Konfetti + XP-Bonus bei Erreichen. Streak-Integration.
**Dateien:** Neue Migration (daily_goal Spalten), Settings, Dashboard, Sidebar
**Status:** ⬜ Ausstehend

#### 4.2 Streak-Freeze (Pro)
**Beschreibung:** Pro-Nutzer erhalten 2 Freezes/Monat. Auto-Verbrauch bei verpasstem Tag. Eis-Icon im Streak-Bereich. Notification "Streak-Freeze hat Serie gerettet!"
**Dateien:** Migration, `gamification.ts`, Gamification-API
**Status:** ⬜ Ausstehend

#### 4.3 Mehr Achievements (auf 20+)
**Beschreibung:** Erweiterung von 12 auf 20+ Achievements:
- Quizzes: Quiz-Marathon (5/Tag), Fehlerlos (3x 90%+)
- Flashcards: Kartenkönig (100/Woche), Alle gewusst (Set ohne Nochmal), Fleißiger Lerner (500 Reviews)
- Streaks: Halbjahresziel (100 Tage)
- Chat: Wissbegierig (20 Nachrichten), Forscher (3 Kurse)
- Allgemein: Experte (Level 10), Nachtlerner (22-06 Uhr), Frühaufsteher (vor 08:00), Alles-Generierer
**Dateien:** Neue Migration (INSERT), `gamification.ts`, Achievement-Check-Logik
**Status:** ⬜ Ausstehend

---

### Phase 5: Fortgeschrittene KI-Features

#### 5.1 Kapitel-basierte KI-Generierung (Fokusbereich)
**Beschreibung:** Optionales "Fokusbereich"-Textfeld bei Quiz- und Flashcard-Generierung. Nutzer gibt z.B. "Kapitel 3" oder "Thema: NLP" ein. KI fokussiert auf diesen Bereich.
**Status:** ⬜ Ausstehend

#### 5.2 Wissensstand-Check (Einstiegsdiagnose)
**Beschreibung:** Button "Wissensstand testen" auf Kurs-Dokumentenseite. 5 MC-Fragen (leicht-schwer). Einschätzung des Niveaus mit Empfehlungen. Im Fortschritts-Tab als "Einstiegsniveau". Kostet 1 KI-Generierung.
**Status:** ⬜ Ausstehend

#### 5.3 Smart Review – KI-Merkhilfen
**Beschreibung:** Nach 3x "Nochmal" bei einer Karte: Angebot "KI-Merkhilfe erstellen". Alternative Erklärung, Beispiel, Eselsbrücke. Einklappbar unter Original-Antwort. Kostet 1 KI-Generierung.
**Status:** ⬜ Ausstehend

---

### Phase 6: UX-Verbesserungen & Polish

#### 6.1 Accessibility-Verbesserungen
**Beschreibung:**
- Heading-Hierarchie fixen (H1 → H2 → H3 ohne Sprünge)
- Skip-Link ("Zum Hauptinhalt springen")
- `aria-label` auf alle 11+ Icon-only Buttons
- Fokus-Indikatoren (`:focus-visible` Styles)
**Status:** ⬜ Ausstehend

#### 6.2 Globaler Fortschrittsüberblick
**Beschreibung:** Neue Seite `/dashboard/progress`. Kurs-Vergleichstabelle, Lernaktivitäts-Heatmap (GitHub-Style), Gesamtstatistiken, XP-Verlauf (30 Tage Liniendiagramm).
**Status:** ⬜ Ausstehend

#### 6.3 Pomodoro-Timer
**Beschreibung:** Timer-Button im Header neben Streak. 25-Min-Timer im Header. Pause-/Session-Notifications. Persistent über Seitenwechsel (Context). +15 XP pro Session.
**Status:** ⬜ Ausstehend

#### 6.4 Pricing-CTAs verbessern
**Problem:** Alle drei Pricing-Karten zeigen "Zum Dashboard".
**Lösung:** Free: "Kostenlos starten →", Basis: "Basis wählen →" (Akzent), Pro: "Pro upgraden →". Eingeloggt: "Aktueller Plan" / "Upgraden".
**Status:** ⬜ Ausstehend

#### 6.5 Quiz-Titel automatisch verbessern
**Problem:** Alle Quizzes heißen generisch "Quiz: [Kursname]".
**Lösung:** KI generiert beschreibenden Titel. Fallback: "Quiz: [Kurs] – [Schwierigkeit] – [Datum]". Nutzer kann überschreiben.
**Status:** ⬜ Ausstehend

#### 6.6 Flashcard-Anzahl in Listenansicht
**Problem:** Flashcard-Sets zeigen keine Kartenanzahl.
**Lösung:** "Flashcards: KI · 22 Karten" in der Listenansicht.
**Status:** ⬜ Ausstehend

#### 6.7 "Alles generieren" Kontingent-Info
**Problem:** Button zeigt nicht, wie viele KI-Generierungen verbraucht werden.
**Lösung:** "Verbraucht X von Y verbleibenden KI-Generierungen". Disabled wenn nicht genug Kontingent.
**Status:** ⬜ Ausstehend

---

## Implementierungsreihenfolge

| #  | Feature                               | Phase | Status |
|----|---------------------------------------|-------|--------|
| 1  | Markdown/LaTeX im Chat               | 1.1   | ✅     |
| 2  | Mobile Navigation Hamburger           | 1.2   | ✅     |
| 3  | Globaler KI-Chat FAB + Panel         | 2.1+2 | ✅     |
| 4  | Quiz Review-Modus                     | 3.1   | ✅     |
| 5  | KI-Tiefenerklärung Quiz-Fehler       | 3.2   | ✅     |
| 6  | Manuelle Flashcard + Edit             | 3.3   | ✅     |
| 7  | Flashcard-Umkehrung                   | 3.4   | ✅     |
| 8  | Flashcard-Reviews Pagination          | 3.5   | ✅     |
| 9  | Tägliches Lernziel                    | 4.1   | ⬜     |
| 10 | Streak-Freeze Pro                     | 4.2   | ⬜     |
| 11 | Mehr Achievements 20+                 | 4.3   | ⬜     |
| 12 | Kapitel-basierte KI-Generierung       | 5.1   | ⬜     |
| 13 | Wissensstand-Check                    | 5.2   | ⬜     |
| 14 | Smart Review KI-Merkhilfen            | 5.3   | ⬜     |
| 15 | Accessibility                         | 6.1   | ⬜     |
| 16 | Globaler Fortschrittsüberblick        | 6.2   | ⬜     |
| 17 | Pomodoro-Timer                        | 6.3   | ⬜     |
| 18 | Pricing-CTAs                          | 6.4   | ⬜     |
| 19 | Quiz-Titel automatisch                | 6.5   | ⬜     |
| 20 | Flashcard-Anzahl Listenansicht        | 6.6   | ⬜     |
| 21 | Alles-generieren Kontingent-Info      | 6.7   | ⬜     |

---

## Danach: Phase F
- Stripe Integration (Payment Processing)
- Vercel Deployment
- Weekly Progress Email (D6)

---

## Verifikation

Nach Implementierung aller Features:

1. `npm run build` — muss fehlerfrei durchlaufen
2. `npm run lint` — keine neuen Warnungen
3. Markdown/LaTeX: Chat, Quiz-Erklärungen, Flashcards rendern korrekt
4. Mobile: Hamburger-Menü auf 375px Viewport, alle Nav-Links erreichbar
5. Globaler KI-Chat: FAB sichtbar auf allen Seiten, Panel öffnet/schließt, Kontext-Wechsel funktioniert
6. Quiz Review: Fehler wiederholen funktioniert, Statistiken werden aktualisiert
7. Flashcards: Manuell erstellen, bearbeiten, umkehren, Pagination bei Reviews
8. Gamification: Tagesziel, Streak-Freeze, neue Achievements werden korrekt freigeschaltet
9. KI-Features: Fokusbereich, Wissenscheck, Smart Review funktionieren
10. Accessibility: Heading-Hierarchie, Skip-Link, aria-labels, Fokus-Indikatoren
11. Fortschrittsseite: Heatmap, Statistiken, XP-Verlauf
12. Dark Mode: Alle neuen Features passen zum Dark Theme
13. Mobile: Alle neuen Features auf 375px Viewport testen
