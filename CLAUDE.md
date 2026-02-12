# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StudyApp is an AI-powered exam preparation web app for German-speaking university students. Users upload their study materials (PDFs, DOCX, TXT), and the app generates quizzes, flashcards, and provides a RAG-based chat that explains content strictly from uploaded documents. Features include spaced repetition (SM-2) for flashcard reviews, a gamification system (XP, levels, streaks, achievements), freemium enforcement (20 AI generations/month free), document summaries, weakness analysis, exam simulator with German grading, multi-output generation, glossary extraction, study plan generator, and a full landing page with DSGVO compliance. The UI is entirely in German.

## Current Status

**Phases 1-3, A, B, C, D are complete. Phase E partially complete (E1-E3 done, E4 API done). Next: E4 page/component, E5 Export, E6 Notenprognose.**

See `ROADMAP.md` for the full feature roadmap and `PLAN.md` for architectural details.

## Commands

- `npm run dev` — Start dev server (Next.js with Turbopack)
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npx shadcn@latest add <component>` — Add a shadcn/ui component

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Tailwind CSS v4** (CSS-based config in `globals.css`, no `tailwind.config.ts`) + **shadcn/ui**
- **Supabase** for PostgreSQL, Auth, Storage, and pgvector (vector similarity search)
- **Vercel AI SDK 6** (`ai` package) with multi-provider support (Anthropic Claude, OpenAI)
- **Zod** for schema validation

## Architecture

### Route Groups
- `src/app/(auth)/` — Public auth pages (login, register). No layout wrapper.
- `src/app/(dashboard)/` — Authenticated area with sidebar layout. The layout (`layout.tsx`) checks auth via `supabase.auth.getUser()` and redirects unauthenticated users.
- `src/app/api/` — API routes for document processing, quiz/flashcard generation, summaries, exam simulator, glossary, study plan, multi-output, and streaming chat.
- `src/app/impressum/` and `src/app/datenschutz/` — Public legal pages (DSGVO compliance).

### Supabase Integration
- **Browser client**: `src/lib/supabase/client.ts` — use in client components
- **Server client**: `src/lib/supabase/server.ts` — use in Server Components and API routes (async, uses `cookies()`)
- **Middleware**: `src/middleware.ts` delegates to `src/lib/supabase/middleware.ts` for session refresh and route protection
- **Database types**: `src/types/database.ts` — manually maintained typed schema matching `supabase/migrations/00001_initial_schema.sql`, `00002_gamification.sql`, `00003_document_summary.sql`, `00004_exam_simulator.sql`, and `00005_glossary_column.sql`
- All tables use **Row Level Security (RLS)** — data is scoped to `auth.uid()`. Child tables (chunks, questions, flashcards) use `exists` subqueries to verify ownership through parent tables.
- A trigger `handle_new_user()` auto-creates a profile row on signup.
- Storage bucket `documents` uses folder-based RLS: files stored at `{user_id}/{filename}`.

### AI Integration
- `src/lib/ai/provider.ts` — `getModel()` returns LLM instance, `getEmbeddingModel()` returns embedding model
- `src/lib/ai/embeddings.ts` — `generateEmbeddings()` batch-embeds text arrays using OpenAI
- Quiz generation: `POST /api/quiz/generate` uses `generateObject()` with Zod schema for structured quiz output. Accepts `questionTypes` parameter to filter MC/TF/open questions.
- Flashcard generation: `POST /api/flashcards/generate` uses `generateObject()` for structured flashcard output
- Document summaries: `POST /api/documents/summarize` uses `generateObject()` for structured summaries (title, keyPoints, keywords, summary). Cached in `documents.summary` column.
- Multi-output generation: `POST /api/documents/generate-all` generates 10 quiz questions + 20 flashcards + 1 summary in a single API call (saves ~75% API calls). Button on course detail Documents tab.
- Exam generation: `POST /api/exam/generate` creates exam questions with weakness-weighted selection, `POST /api/exam/submit` grades answers with German grading system (1,0-5,0).
- Glossary extraction: `POST /api/documents/glossary` extracts 15-30 technical terms with definitions. Cached in `documents.glossary` column.
- Study plan generation: `POST /api/study-plan/generate` creates day-by-day study plan based on exam date and course materials (Pro only).
- RAG Chat: `POST /api/chat` uses `streamText()` with embedding-based retrieval + `toUIMessageStreamResponse()`; client uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport`
- RAG pipeline: embed user query → pgvector similarity search via `match_document_chunks()` SQL function → pass relevant chunks as context to LLM
- **IMPORTANT (AI SDK 6):** `useChat()` returns `{ messages, sendMessage, status }` — NOT `input`/`handleSubmit`/`isLoading`. Server must return `toUIMessageStreamResponse()` (NOT `toDataStreamResponse` which no longer exists). Client must use `DefaultChatTransport` and manage input state manually with `useState`.

### Document Processing Pipeline
- Upload (client-side): file → Supabase Storage + document record with status "uploading"
- Processing (`POST /api/documents/process`): download file → extract text (`pdf-parse` for PDF, `mammoth` for DOCX, UTF-8 for TXT) → chunk into ~3000 char segments with 500 char overlap → embed with OpenAI `text-embedding-3-small` → store in `document_chunks` with pgvector → update status to "ready"
- `src/lib/documents/parser.ts` — text extraction per file type
- `src/lib/documents/chunker.ts` — paragraph-aware text chunking with configurable size/overlap

### Course Detail Page
The course detail page (`/dashboard/courses/[courseId]`) uses client-side tabs (shadcn Tabs) for Documents (with summaries), Quizzes, Flashcards, Chat, and Fortschritt (progress/weakness analysis) sections. Data is fetched server-side and passed to the `CourseDetail` client component.

### Landing Page
- `src/app/page.tsx` — Server component, detects auth state (shows "Zum Dashboard" vs "Registrieren")
- Components in `src/components/landing/`: navbar, hero, features, how-it-works, pricing, faq, footer
- Links to `/impressum` and `/datenschutz` in footer

### Gamification System
- `src/lib/gamification.ts` — XP rewards, level thresholds, streak logic, achievement checking
- `src/lib/gamification-client.ts` — Client-side `trackActivity()` that calls `/api/gamification` and shows achievement toasts
- `POST /api/gamification` — Grants XP, updates streaks, checks achievements, returns `{ xp_earned, total_xp, level, streak, new_achievements }`
- Gamification UI components in `src/components/gamification/` (XP progress bar, streak display, achievement badge/toast)
- Onboarding wizard in `src/components/onboarding/` — 5-step wizard for new users
- DB tables: `achievements` (pre-populated, 12 German achievements), `user_achievements`, `study_sessions`
- Profile columns: `xp`, `level`, `current_streak`, `longest_streak`, `last_study_date`, `onboarding_completed`

### Spaced Repetition (SM-2)
- `src/lib/spaced-repetition.ts` — SM-2 algorithm: `calculateSM2(quality, previousInterval, previousEaseFactor)` returns `{ interval, easeFactor, nextReviewDate }`
- Quality mapping: "Nochmal"=1, "Schwer"=3, "Gut"=4, "Einfach"=5. New cards start with interval=0, easeFactor=2.5
- `POST /api/flashcards/review` — Records review, runs SM-2, inserts `flashcard_reviews` row
- `GET /api/flashcards/due?courseId=xxx` — Returns due cards (never reviewed OR `next_review_at <= now`), grouped by course
- Review pages: `/dashboard/reviews` (overview), `/dashboard/reviews/[courseId]` (interactive session)
- `src/components/flashcard/review-session.tsx` — Client component: flip card → rate (4 buttons) → SM-2 → next card → session summary with XP. Keyboard: Space/Enter=flip, 1-4=rate. "Nochmal" cards re-queued at end.

### Achievements Page
- `/dashboard/achievements` — Server component loading all achievements + user unlock status
- `src/components/gamification/achievements-grid.tsx` — Groups achievements by category (courses, documents, quizzes, flashcards, streaks, levels), shows unlocked (colorful + date) vs locked (gray + description)

### Freemium Enforcement
- `src/lib/freemium.ts` — `checkFreemiumLimit(userId)` checks `ai_generations_used` vs tier limit (free=20, premium=Infinity), auto-resets after 30 days. Also exports `incrementUsage()` and `getFreemiumErrorMessage()`.
- Enforced in: `/api/quiz/generate`, `/api/flashcards/generate`, `/api/chat`, `/api/documents/summarize` — returns 402 JSON with German error message when limit exceeded
- `src/components/freemium/upgrade-prompt.tsx` — `UpgradePrompt` dialog (usage bar, premium benefits) + `UpgradeBanner` (inline, shown at 80%+ usage)
- `profiles.ai_generations_used` tracks monthly usage. `profiles.ai_generations_reset_at` triggers auto-reset after 30 days.

### Analytics & Weakness Analysis
- `src/lib/analytics.ts` — Pure client-side analysis: `analyzeWeaknesses()` computes error rates per document from quiz attempts, `computeQuizTrend()` tracks score history
- `src/components/progress/weakness-chart.tsx` — Weakness chart with per-document error rates, quiz score history, overview stats
- Integrated as "Fortschritt" tab in course detail page

### Exam Simulator (Phase E1)
- `POST /api/exam/generate` — Generates exam questions (50% MC, 25% TF, 25% free text) with point values (MC=2, TF=1, FT=3). Weakness-weighted: analyzes past quiz attempts to emphasize weak topics. Freemium-checked.
- `POST /api/exam/submit` — Grades exam answers, maps score to German grade (1,0-5,0), stores results.
- `src/components/exam/exam-session.tsx` — Full exam UI: countdown timer (color-coded: green→yellow→red→pulse), question navigation pills, MC/TF/free text input, confirm-before-submit with unanswered warning. Auto-submits when time expires.
- `src/components/exam/exam-result.tsx` — Result view: large grade display with color coding, points breakdown, per-question review with correct/wrong markers and explanations.
- `/dashboard/courses/[courseId]/exam` — Exam config page (time limit 30-120min, 10-30 questions) + past attempt history.
- DB: `exam_attempts` table with questions/answers as JSONB, grade, score, points, timing.
- "Klausur" tab added to course detail page.

### Multi-Output Generation (Phase E2)
- `POST /api/documents/generate-all` — Single API call generates 10 quiz questions + 20 flashcards + 1 summary. Stores quiz in `quizzes`/`quiz_questions`, flashcards in `flashcard_sets`/`flashcards`, summary cached in `documents.summary`. Counts as 1 AI generation.
- "Alles generieren" button in course detail Documents tab (highlighted card with Zap icon).

### Glossary (Phase E3)
- `POST /api/documents/glossary` — Extracts 15-30 technical terms with definitions and context from document chunks. Cached in `documents.glossary` column (JSON string).
- `src/components/document/glossary-view.tsx` — Alphabetically grouped, searchable glossary per document. Lazy generation (click to create).
- DB: `documents.glossary` column (text, nullable). Migration: `00005_glossary_column.sql`.
- Displayed in course detail Documents tab below summaries.

### Study Plan Generator (Phase E4, Pro only)
- `POST /api/study-plan/generate` — Takes courseId, examDate, dailyMinutes. Generates day-by-day plan with tasks (read, quiz, flashcards, review, exam). Pro tier check (403 for non-Pro).
- `src/app/(dashboard)/dashboard/study-plan/page.tsx` — Study plan page (WIP).

## Key Conventions

- Path alias `@/*` maps to `./src/*`
- Use `sonner` for toast notifications (Toaster is in root layout)
- Icons from `lucide-react`
- Database migrations live in `supabase/migrations/` (numbered SQL files)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `next.config.ts` has `serverExternalPackages: ["pdf-parse"]` for server-side PDF processing
- Course components in `src/components/course/`, document components in `src/components/document/`
- Gamification components in `src/components/gamification/`, onboarding in `src/components/onboarding/`
- Freemium components in `src/components/freemium/`, flashcard review in `src/components/flashcard/`
- Exam components in `src/components/exam/`, study plan in `src/components/study-plan/`
- Landing page components in `src/components/landing/`
- Progress/analytics components in `src/components/progress/`
- All UI text is in German; code (variable names, comments) is in English

## Known Issues

- **TypeScript `never` types**: The manually maintained `Database` type in `src/types/database.ts` doesn't include `Relationships` arrays expected by `@supabase/ssr` generics. Workaround: `as never` for `.insert()`/`.update()` arguments, `as unknown as Type` for `.select()` results. Permanent fix: regenerate types with `supabase gen types typescript --project-id <project-id>`. App works correctly at runtime — this is compile-time only.
- **Hydration mismatch**: Radix UI generates differing IDs server/client — cosmetic only, no functional impact.
