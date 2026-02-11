# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StudyApp is an AI-powered exam preparation web app for German-speaking university students. Users upload their study materials (PDFs, DOCX, TXT), and the app generates quizzes, flashcards, and provides a RAG-based chat that explains content strictly from uploaded documents. The UI is entirely in German.

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
- `src/app/api/` — API routes for document processing, quiz/flashcard generation, and streaming chat.

### Supabase Integration
- **Browser client**: `src/lib/supabase/client.ts` — use in client components
- **Server client**: `src/lib/supabase/server.ts` — use in Server Components and API routes (async, uses `cookies()`)
- **Middleware**: `src/middleware.ts` delegates to `src/lib/supabase/middleware.ts` for session refresh and route protection
- **Database types**: `src/types/database.ts` — manually maintained typed schema matching `supabase/migrations/00001_initial_schema.sql` and `00002_gamification.sql`
- All tables use **Row Level Security (RLS)** — data is scoped to `auth.uid()`. Child tables (chunks, questions, flashcards) use `exists` subqueries to verify ownership through parent tables.
- A trigger `handle_new_user()` auto-creates a profile row on signup.
- Storage bucket `documents` uses folder-based RLS: files stored at `{user_id}/{filename}`.

### AI Integration
- `src/lib/ai/provider.ts` — `getModel()` returns LLM instance, `getEmbeddingModel()` returns embedding model
- `src/lib/ai/embeddings.ts` — `generateEmbeddings()` batch-embeds text arrays using OpenAI
- Quiz generation: `POST /api/quiz/generate` uses `generateObject()` with Zod schema for structured quiz output
- Flashcard generation: `POST /api/flashcards/generate` uses `generateObject()` for structured flashcard output
- RAG Chat: `POST /api/chat` uses `streamText()` with embedding-based retrieval + `toUIMessageStreamResponse()`; client uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport`
- RAG pipeline: embed user query → pgvector similarity search via `match_document_chunks()` SQL function → pass relevant chunks as context to LLM
- **IMPORTANT (AI SDK 6):** `useChat()` returns `{ messages, sendMessage, status }` — NOT `input`/`handleSubmit`/`isLoading`. Server must return `toUIMessageStreamResponse()` (NOT `toDataStreamResponse` which no longer exists). Client must use `DefaultChatTransport` and manage input state manually with `useState`.

### Document Processing Pipeline
- Upload (client-side): file → Supabase Storage + document record with status "uploading"
- Processing (`POST /api/documents/process`): download file → extract text (`pdf-parse` for PDF, `mammoth` for DOCX, UTF-8 for TXT) → chunk into ~3000 char segments with 500 char overlap → embed with OpenAI `text-embedding-3-small` → store in `document_chunks` with pgvector → update status to "ready"
- `src/lib/documents/parser.ts` — text extraction per file type
- `src/lib/documents/chunker.ts` — paragraph-aware text chunking with configurable size/overlap

### Course Detail Page
The course detail page (`/dashboard/courses/[courseId]`) uses client-side tabs (shadcn Tabs) for Documents, Quizzes, Flashcards, and Chat sections. Data is fetched server-side and passed to the `CourseDetail` client component.

### Gamification System
- `src/lib/gamification.ts` — XP rewards, level thresholds, streak logic, achievement checking
- `src/lib/gamification-client.ts` — Client-side `trackActivity()` that calls `/api/gamification` and shows achievement toasts
- `POST /api/gamification` — Grants XP, updates streaks, checks achievements, returns `{ xp_earned, total_xp, level, streak, new_achievements }`
- Gamification UI components in `src/components/gamification/` (XP progress bar, streak display, achievement badge/toast)
- Onboarding wizard in `src/components/onboarding/` — 5-step wizard for new users
- DB tables: `achievements` (pre-populated, 12 German achievements), `user_achievements`, `study_sessions`
- Profile columns: `xp`, `level`, `current_streak`, `longest_streak`, `last_study_date`, `onboarding_completed`

### Freemium Model
`profiles.ai_generations_used` tracks monthly usage (20/month free tier). Incremented after each AI generation (quiz, flashcard, chat message). Reset tracked via `ai_generations_reset_at`.

## Key Conventions

- Path alias `@/*` maps to `./src/*`
- Use `sonner` for toast notifications (Toaster is in root layout)
- Icons from `lucide-react`
- Database migrations live in `supabase/migrations/` (numbered SQL files)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `next.config.ts` has `serverExternalPackages: ["pdf-parse"]` for server-side PDF processing
- Course components in `src/components/course/`, document components in `src/components/document/`
- Gamification components in `src/components/gamification/`, onboarding in `src/components/onboarding/`
- All UI text is in German; code (variable names, comments) is in English
