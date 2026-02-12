# StudyApp - Interaktive Lern-WebApp für Studierende

## Kontext

Studierende im DACH-Raum verbringen viel Zeit damit, ihre Prüfungsunterlagen manuell in Lernmaterialien umzuwandeln. Die App löst dieses Problem: Unterlagen hochladen, KI generiert automatisch Quizfragen und Flashcards, ein Chat erklärt die Inhalte. Konkurrenten wie StudyFetch, Knowt und NotebookLM zeigen, dass der Markt validiert ist – aber keine dieser Apps fokussiert sich auf deutschsprachige Uni-Studierende.

**Differenzierung gegenüber Konkurrenz:**
- Fokus auf DACH-Markt / deutschsprachige UI und Inhalte
- RAG-basierter Chat der strikt auf den eigenen Unterlagen basiert (kein Halluzinieren)
- Flexible AI-Provider (Claude, OpenAI, etc.) via Vercel AI SDK
- Freemium-Modell mit großzügigem Free Tier

---

## Techstack

| Bereich | Technologie | Version |
|---|---|---|
| **Framework** | Next.js (App Router) + React | 16.x + React 19.x |
| **Sprache** | TypeScript | 5.9 |
| **Styling** | Tailwind CSS + shadcn/ui | v4.0 + shadcn@3.x |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Storage + pgvector) | latest |
| **AI** | Vercel AI SDK 6 (multi-provider: Claude, OpenAI, etc.) | v6.x |
| **Embeddings** | OpenAI text-embedding-3-small (oder alternatives Modell) | - |
| **Vektor-Suche** | Supabase pgvector Extension | - |
| **Deployment** | Vercel | - |
| **Payments** | Stripe (für Premium Tier, post-MVP) | - |

**AI SDK 6 Features die wir nutzen:**
- `ToolLoopAgent` - Wiederverwendbare Agenten für Quiz-Generierung und RAG-Chat
- `Output.object()` / `Output.array()` - Strukturierter Output für Quiz-Fragen (JSON)
- `useChat` - React Hook für Streaming-Chat mit type-safe Tool-Rendering
- Multi-Provider Gateway (`gateway()`) - Flexibler Wechsel zwischen Claude/OpenAI
- DevTools (`@ai-sdk/devtools`) - Debugging der AI-Calls während Entwicklung

**Wichtige Libraries:**
- `ai` + `@ai-sdk/react` (Vercel AI SDK 6) - Agents, Streaming, structured output
- `@ai-sdk/anthropic` + `@ai-sdk/openai` - AI Provider
- `@supabase/supabase-js` + `@supabase/ssr` - Supabase Client
- `pdf-parse` - PDF Text-Extraktion
- `mammoth` - DOCX Text-Extraktion
- `zod` - Schema-Validierung
- `react-hook-form` - Formulare
- `lucide-react` - Icons
- `sonner` - Toast Notifications

---

## Datenbank-Schema

```
profiles
├── id (uuid, FK → auth.users)
├── display_name (text)
├── tier (enum: free | premium)
├── ai_generations_used (int, reset monatlich)
├── ai_generations_reset_at (timestamp)
└── created_at / updated_at

courses
├── id (uuid)
├── user_id (uuid, FK → profiles)
├── name (text) -- z.B. "Lineare Algebra WS25"
├── description (text, optional)
├── color (text, optional)
└── created_at / updated_at

documents
├── id (uuid)
├── course_id (uuid, FK → courses)
├── user_id (uuid, FK → profiles)
├── name (text) -- Dateiname
├── file_path (text) -- Supabase Storage Pfad
├── file_type (enum: pdf | docx | pptx | txt)
├── file_size (int)
├── status (enum: uploading | processing | ready | error)
├── content_text (text) -- Extrahierter Volltext
└── created_at / updated_at

document_chunks
├── id (uuid)
├── document_id (uuid, FK → documents)
├── content (text) -- Chunk-Text
├── chunk_index (int) -- Position im Dokument
├── embedding (vector(1536)) -- pgvector
└── created_at

quizzes
├── id (uuid)
├── course_id (uuid, FK → courses)
├── user_id (uuid, FK → profiles)
├── title (text)
├── document_ids (uuid[]) -- Quell-Dokumente
├── difficulty (enum: easy | medium | hard)
├── question_count (int)
└── created_at

quiz_questions
├── id (uuid)
├── quiz_id (uuid, FK → quizzes)
├── question_text (text)
├── question_type (enum: multiple_choice | true_false | free_text)
├── options (jsonb) -- [{label, text, is_correct}]
├── correct_answer (text)
├── explanation (text) -- AI-generierte Erklärung
└── order_index (int)

quiz_attempts
├── id (uuid)
├── quiz_id (uuid, FK → quizzes)
├── user_id (uuid, FK → profiles)
├── answers (jsonb) -- [{question_id, selected_answer, is_correct}]
├── score (int) -- Prozent korrekt
├── completed_at (timestamp)
└── created_at

flashcard_sets
├── id (uuid)
├── course_id (uuid, FK → courses)
├── user_id (uuid, FK → profiles)
├── title (text)
├── document_ids (uuid[])
└── created_at

flashcards
├── id (uuid)
├── set_id (uuid, FK → flashcard_sets)
├── front (text) -- Frage/Begriff
├── back (text) -- Antwort/Definition
├── order_index (int)
└── created_at

flashcard_reviews
├── id (uuid)
├── flashcard_id (uuid, FK → flashcards)
├── user_id (uuid, FK → profiles)
├── quality (int, 0-5) -- SM-2 Bewertung
├── interval (int) -- Tage bis nächste Review
├── ease_factor (float)
├── next_review_at (timestamp)
└── reviewed_at (timestamp)

chat_messages
├── id (uuid)
├── course_id (uuid, FK → courses)
├── user_id (uuid, FK → profiles)
├── role (enum: user | assistant)
├── content (text)
├── source_chunks (uuid[]) -- Referenzierte Chunks
└── created_at
```

---

## Feature-Übersicht & MVP-Scope

### 1. Auth & Profil
- Email/Passwort Registrierung & Login (Supabase Auth)
- Profil mit Display-Name
- Tier-Anzeige (Free/Premium)
- Usage-Counter (AI-Generierungen diesen Monat)

### 2. Kurse / Fächer verwalten
- CRUD für Kurse (Name, Beschreibung, Farbe)
- Dashboard mit Kursübersicht
- Kurs-Detailseite mit Dokumenten, Quizzes, Flashcards

### 3. Dokument-Upload & Verarbeitung
- Upload von PDF, DOCX, TXT (PPT post-MVP)
- Datei in Supabase Storage speichern
- **Processing Pipeline (Server-Side):**
  1. Text aus Datei extrahieren (`pdf-parse`, `mammoth`)
  2. Text in Chunks aufteilen (~500-1000 Tokens pro Chunk, mit Overlap)
  3. Chunks embedden (OpenAI Embeddings API)
  4. Embeddings in `document_chunks` mit pgvector speichern
- Status-Anzeige (uploading → processing → ready)
- Dokument-Liste pro Kurs

### 4. AI-Quiz-Generierung
- Benutzer wählt: Kurs/Dokument(e), Schwierigkeit, Fragenanzahl
- Server holt relevante Chunks via Embedding-Similarity
- LLM generiert Fragen mit strukturiertem Output (JSON)
- Fragetypen: Multiple Choice, Wahr/Falsch, Freitext
- AI generiert auch Erklärungen für jede Antwort

### 5. Quiz-Modus (Interaktiv)
- Frage-für-Frage Ansicht
- Antwort auswählen / eingeben
- Sofortiges Feedback (richtig/falsch + Erklärung)
- Ergebnis-Zusammenfassung am Ende
- Quiz-Versuch wird gespeichert

### 6. AI-Chat (RAG)
- Chat-Interface pro Kurs
- User stellt Frage → Embedding → Similarity Search in pgvector
- Relevante Chunks als Kontext an LLM senden
- Streaming-Antwort via Vercel AI SDK
- Quellenangaben (welches Dokument, welcher Abschnitt)
- Chat-Verlauf wird gespeichert

### 7. Flashcards
- AI-generierte Flashcards aus Dokumenten
- Karten durchblättern (Flip-Animation)
- Selbstbewertung (1-5, SM-2 Algorithmus)
- Spaced Repetition: fällige Karten werden priorisiert
- Manuelles Erstellen/Bearbeiten von Karten

### 8. Lernfortschritt
- Dashboard mit Statistiken pro Kurs:
  - Quiz-Scores über Zeit
  - Schwache Themen (häufig falsch beantwortete Fragen)
  - Flashcard-Fortschritt (gelernt vs. fällig)
- Gesamtübersicht über alle Kurse

### 9. Freemium-System
- **Free Tier:** 20 AI-Generierungen/Monat (Quiz/Flashcard/Chat-Nachrichten)
- **Premium Tier:** Unlimitiert
- Usage-Tracking und Limit-Enforcement
- Upgrade-Prompt wenn Limit erreicht
- Stripe-Integration (post-MVP, zunächst manuell schaltbar)

---

## Projektstruktur

```
study_app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth-Routen (Login, Register)
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/              # Authentifizierter Bereich
│   │   │   ├── layout.tsx            # Dashboard Layout mit Sidebar
│   │   │   ├── page.tsx              # Dashboard Home
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx          # Kurs-Übersicht
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx      # Kurs-Detail
│   │   │   │       ├── documents/
│   │   │   │       ├── quiz/
│   │   │   │       │   ├── new/page.tsx    # Quiz erstellen
│   │   │   │       │   └── [quizId]/page.tsx # Quiz spielen
│   │   │   │       ├── flashcards/
│   │   │   │       │   ├── new/page.tsx
│   │   │   │       │   └── [setId]/page.tsx
│   │   │   │       ├── chat/page.tsx
│   │   │   │       └── progress/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/                      # API Routes
│   │   │   ├── documents/
│   │   │   │   ├── upload/route.ts
│   │   │   │   └── process/route.ts
│   │   │   ├── quiz/
│   │   │   │   └── generate/route.ts
│   │   │   ├── flashcards/
│   │   │   │   └── generate/route.ts
│   │   │   └── chat/route.ts         # Streaming Chat Endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Landing Page
│   ├── components/
│   │   ├── ui/                       # shadcn/ui Komponenten
│   │   ├── auth/                     # Auth-Formulare
│   │   ├── course/                   # Kurs-Komponenten
│   │   ├── document/                 # Upload, Liste
│   │   ├── quiz/                     # Quiz UI
│   │   ├── flashcard/                # Flashcard UI
│   │   ├── chat/                     # Chat Interface
│   │   └── progress/                 # Charts, Stats
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser-Client
│   │   │   ├── server.ts             # Server-Client
│   │   │   └── middleware.ts         # Auth Middleware
│   │   ├── ai/
│   │   │   ├── provider.ts           # AI Provider Config (Gateway)
│   │   │   ├── embeddings.ts         # Embedding-Funktionen
│   │   │   ├── agents/
│   │   │   │   ├── quiz-agent.ts     # ToolLoopAgent für Quiz-Generierung
│   │   │   │   ├── flashcard-agent.ts # ToolLoopAgent für Flashcard-Generierung
│   │   │   │   └── chat-agent.ts     # ToolLoopAgent für RAG-Chat
│   │   │   └── tools/
│   │   │       ├── retrieve-chunks.ts # RAG Retrieval Tool
│   │   │       └── search-documents.ts # Dokument-Suche Tool
│   │   ├── documents/
│   │   │   ├── parser.ts             # PDF/DOCX Text-Extraktion
│   │   │   └── chunker.ts            # Text-Chunking
│   │   ├── spaced-repetition.ts      # SM-2 Algorithmus
│   │   ├── usage.ts                  # Freemium Usage Tracking
│   │   └── utils.ts
│   ├── hooks/                        # Custom React Hooks
│   └── types/                        # TypeScript Types
├── supabase/
│   ├── migrations/                   # SQL Migrations
│   └── seed.sql                      # Test-Daten
├── public/
├── .env.local                        # Env Vars (API Keys etc.)
├── next.config.ts
├── app.css                        # Tailwind v4 (CSS-basierte Config)
├── tsconfig.json
└── package.json
```

---

## Implementierungs-Reihenfolge

### Phase 1: Fundament (Schritt 1-4) ✅
1. ✅ **Projekt-Setup**: Next.js 16, TypeScript 5.9, Tailwind v4, shadcn/ui, Supabase-Projekt
2. ✅ **Supabase Schema**: Migrations für alle Tabellen, pgvector aktivieren, RLS Policies
3. ✅ **Auth**: Login, Register, Middleware, geschützter Bereich
4. ✅ **Dashboard Layout**: Sidebar-Navigation, responsive Design

### Phase 2: Dokument-Pipeline (Schritt 5-7) ✅
5. ✅ **Kurs-CRUD**: Erstellen, bearbeiten, löschen, Übersicht (Dialog-basiert, Farbwahl, Detailseite mit Tabs)
6. ✅ **Dokument-Upload**: File Upload UI mit Drag & Drop, Supabase Storage Integration, Fortschrittsanzeige
7. ✅ **Dokument-Verarbeitung**: Text-Extraktion (pdf-parse/mammoth), Chunking mit Overlap, OpenAI Embedding, pgvector Speicherung via `/api/documents/process`

### Phase 3: AI-Features (Schritt 8-11) ✅
8. ✅ **Quiz-Generierung**: Dokument-Auswahl, Schwierigkeit, Fragenanzahl; `generateObject()` mit Zod-Schema; Multiple Choice, Wahr/Falsch, Freitext
9. ✅ **Quiz-Modus**: Frage-für-Frage Ansicht, Sofort-Feedback mit Erklärung, Ergebnis-Zusammenfassung, Quiz-Versuch wird gespeichert
10. ✅ **AI-Chat**: RAG Pipeline mit Embedding-Suche, Streaming via `streamText()`, `useChat` Hook, Chat-Verlauf persistent
11. ✅ **Flashcards**: AI-Generierung mit `generateObject()`, Flip-Animation, Gewusst-Markierung, Mischen, Keyboard-Navigation

### Phase A: Bug Fix + End-to-End Validierung ✅ (größtenteils)

**Gefixt:**
- ✅ Stale-Closure Bug (`document-upload.tsx`): `localSuccessCount` statt stale `files` State
- ✅ pdf-parse v2 API (`parser.ts`): Neue class-based API `new PDFParse({ data: buffer })`
- ✅ Retry-Button für fehlgeschlagene Dokumente (`course-detail.tsx`)
- ✅ Dokument-Verarbeitung: Upload → Extraktion → Chunking → Embedding → Status "ready"
- ✅ Quiz-Generierung: Zod v4 + AI SDK 6 `generateObject()` kompatibel!
- ✅ Flashcard-Generierung: Funktioniert

- ✅ Chat-Crash gefixt: `@ai-sdk/react@3.0.80` neues API (`sendMessage`, `status`, `DefaultChatTransport`, `UIMessage` parts, `toUIMessageStreamResponse()`)
- ✅ Wahr/Falsch Quiz-Buttons: Fallback "Wahr"/"Falsch" Optionen wenn AI leere Options liefert

### Phase B: UI/UX Verbesserung ✅

- ✅ **B1.** DB-Migration `00002_gamification.sql` (profiles-Spalten, achievements, user_achievements, study_sessions)
- ✅ **B2.** TypeScript Types erweitert (Achievement, UserAchievement, StudySession, Profile-Gamification-Spalten)
- ✅ **B3.** Gamification Library (`src/lib/gamification.ts`) — XP, Level, Streak, Achievement-Logik
- ✅ **B4.** Gamification API (`/api/gamification`) — XP vergeben, Level/Streak updaten, Achievements prüfen
- ✅ **B5.** Gamification UI-Komponenten (xp-progress, streak-display, achievement-badge, achievement-toast)
- ✅ **B6.** Dashboard Redesign — XP/Streak-Widgets, Aktivität, fällige Reviews, Achievements
- ✅ **B7.** Course Cards — Gradient-Akzent, Hover-Effekte, "Zuletzt gelernt"
- ✅ **B8.** Onboarding Wizard — 5-Schritt Modal für neue User
- ✅ **B9.** Sidebar — XP-Bar, Streak, neue Nav-Items (Wiederholungen, Erfolge), KI-Nutzung
- ✅ **B10.** Empty States — bestehende beibehalten
- ✅ **B11.** shadcn-Komponenten installiert (alert, scroll-area, collapsible)
- ✅ **B12.** Gamification-Tracking integriert in Quiz, Chat, Upload, Kurs-Erstellung

### Phase C: Spaced Repetition, Fortschritt, Freemium ✅

**C1. SM-2 Algorithmus** ✅
- `src/lib/spaced-repetition.ts` — SuperMemo SM-2, Quality-Mapping (Nochmal=1, Schwer=3, Gut=4, Einfach=5)

**C2. Review API Routes** ✅
- `POST /api/flashcards/review` — Review aufzeichnen + SM-2 berechnen
- `GET /api/flashcards/due` — Fällige Flashcards abrufen

**C3. Review Session Pages** ✅
- `/dashboard/reviews` — Übersicht: Fällige Karten nach Kurs gruppiert
- `/dashboard/reviews/[courseId]` — Interaktive Review-Session mit Flip + Bewertung

**C4. Achievements Page** ✅
- `/dashboard/achievements` — Grid aller Achievements nach Kategorie

**C5. Freemium Enforcement** ✅
- `src/lib/freemium.ts` — `checkFreemiumLimit()`, 402 Response bei Limit (20/Monat Free)
- Limit-Check in Quiz-Generate, Flashcard-Generate, Chat

**C6. Nutzungszähler-Komponente** ✅
- `src/components/gamification/usage-meter.tsx` — Visueller Balken in Sidebar

### Phase D: Landing Page + Features ✅

**D5. DSGVO-Compliance** ✅
- `src/app/datenschutz/page.tsx` — Datenschutzerklärung (DSGVO-konform)
- `src/app/impressum/page.tsx` — Impressum (§5 TMG)
- `src/components/cookie-banner.tsx` — Cookie-Banner (nur technische Cookies)

**D1. Landing Page** ✅ (`src/app/page.tsx` — Server Component)
- Navbar, Hero, Features (6-Grid), How-It-Works (4 Schritte), Pricing (3 Tiers), FAQ (6 Items), Footer
- Auth-aware: Zeigt "Zum Dashboard" für eingeloggte User
- Komponenten in `src/components/landing/`

**D2. Zusammenfassungen** ✅
- `src/app/api/documents/summarize/route.ts` — AI-generierte Zusammenfassungen mit Caching
- `src/components/document/summary-view.tsx` — Strukturierte Anzeige (Kernaussagen, Schlüsselbegriffe)
- DB-Migration: `supabase/migrations/00003_document_summary.sql`

**D3. Schwächenanalyse** ✅ (rein algorithmisch, 0 API-Kosten)
- `src/lib/analytics.ts` — `analyzeWeaknesses()`, `computeQuizTrend()`
- `src/components/progress/weakness-chart.tsx` — Fehlerquoten pro Dokument, Quiz-Verlauf
- Integriert als "Fortschritt"-Tab in Kurs-Detailseite

**D6. Quiz-Fragetyp-Auswahl** ✅
- Checkboxen: MC / Wahr-Falsch / Offene Fragen (min. 1 ausgewählt)
- `getQuestionTypesPrompt()` in Quiz-Generate API

---

## Verifikation pro Phase

1. **Phase A:** ✅ Dokument hochladen → verarbeitet zu "ready" → Quiz/Flashcard/Chat funktionieren
2. **Phase B:** ✅ Neuer User sieht Onboarding → Dashboard zeigt XP/Streaks/Aktivität → Gamification funktioniert
3. **Phase C:** ✅ Review Session: Karten flippen + bewerten → SM-2 plant nächstes Review → Freemium blockiert bei Limit
4. **Phase D:** ✅ Landing Page rendert → `npm run build` sauber → DSGVO-Seiten vorhanden → Zusammenfassungen + Schwächenanalyse funktionieren
5. **Phase E:** Klausur-Simulator + Premium-Features funktionieren
6. **Phase F:** Stripe-Zahlung funktioniert → Vercel Deployment läuft → App produktionsreif
