-- Phase E1: Klausur-Simulator (Exam Simulator)
-- Stores exam attempt results with grading, timing, and question data

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  document_ids uuid[] not null default '{}',
  time_limit_minutes int not null default 60,
  questions jsonb not null default '[]',
  answers jsonb not null default '[]',
  score int not null default 0, -- percentage 0-100
  grade text not null default '5,0', -- German grade (1,0 - 5,0)
  total_points int not null default 0,
  earned_points int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS policies
alter table public.exam_attempts enable row level security;

create policy "Users can view own exam attempts"
  on public.exam_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own exam attempts"
  on public.exam_attempts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own exam attempts"
  on public.exam_attempts for update
  using (auth.uid() = user_id);

-- Index for faster lookups
create index if not exists idx_exam_attempts_course_id on public.exam_attempts(course_id);
create index if not exists idx_exam_attempts_user_id on public.exam_attempts(user_id);
