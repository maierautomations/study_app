-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  ai_generations_used integer not null default 0,
  ai_generations_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- COURSES
-- ============================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Users can CRUD own courses"
  on public.courses for all
  using (auth.uid() = user_id);

-- ============================================
-- DOCUMENTS
-- ============================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_type text not null check (file_type in ('pdf', 'docx', 'pptx', 'txt')),
  file_size integer not null,
  status text not null default 'uploading' check (status in ('uploading', 'processing', 'ready', 'error')),
  content_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can CRUD own documents"
  on public.documents for all
  using (auth.uid() = user_id);

-- ============================================
-- DOCUMENT CHUNKS (with pgvector)
-- ============================================
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.document_chunks enable row level security;

create policy "Users can view own document chunks"
  on public.document_chunks for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can insert own document chunks"
  on public.document_chunks for insert
  with check (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can delete own document chunks"
  on public.document_chunks for delete
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
      and documents.user_id = auth.uid()
    )
  );

-- Create HNSW index for fast similarity search
create index on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

-- Similarity search function
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  filter_document_ids uuid[] default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where d.user_id = auth.uid()
    and (filter_document_ids is null or dc.document_id = any(filter_document_ids))
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================
-- QUIZZES
-- ============================================
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  document_ids uuid[] not null default '{}',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  question_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;

create policy "Users can CRUD own quizzes"
  on public.quizzes for all
  using (auth.uid() = user_id);

-- ============================================
-- QUIZ QUESTIONS
-- ============================================
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'free_text')),
  options jsonb not null default '[]',
  correct_answer text not null,
  explanation text not null default '',
  order_index integer not null default 0
);

alter table public.quiz_questions enable row level security;

create policy "Users can view own quiz questions"
  on public.quiz_questions for select
  using (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

create policy "Users can insert own quiz questions"
  on public.quiz_questions for insert
  with check (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

create policy "Users can delete own quiz questions"
  on public.quiz_questions for delete
  using (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

-- ============================================
-- QUIZ ATTEMPTS
-- ============================================
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '[]',
  score integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.quiz_attempts enable row level security;

create policy "Users can CRUD own quiz attempts"
  on public.quiz_attempts for all
  using (auth.uid() = user_id);

-- ============================================
-- FLASHCARD SETS
-- ============================================
create table public.flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  document_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.flashcard_sets enable row level security;

create policy "Users can CRUD own flashcard sets"
  on public.flashcard_sets for all
  using (auth.uid() = user_id);

-- ============================================
-- FLASHCARDS
-- ============================================
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.flashcard_sets(id) on delete cascade,
  front text not null,
  back text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.flashcards enable row level security;

create policy "Users can view own flashcards"
  on public.flashcards for select
  using (
    exists (
      select 1 from public.flashcard_sets
      where flashcard_sets.id = flashcards.set_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

create policy "Users can insert own flashcards"
  on public.flashcards for insert
  with check (
    exists (
      select 1 from public.flashcard_sets
      where flashcard_sets.id = flashcards.set_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

create policy "Users can update own flashcards"
  on public.flashcards for update
  using (
    exists (
      select 1 from public.flashcard_sets
      where flashcard_sets.id = flashcards.set_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

create policy "Users can delete own flashcards"
  on public.flashcards for delete
  using (
    exists (
      select 1 from public.flashcard_sets
      where flashcard_sets.id = flashcards.set_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- ============================================
-- FLASHCARD REVIEWS
-- ============================================
create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quality integer not null check (quality between 0 and 5),
  interval integer not null default 1,
  ease_factor float not null default 2.5,
  next_review_at timestamptz not null,
  reviewed_at timestamptz not null default now()
);

alter table public.flashcard_reviews enable row level security;

create policy "Users can CRUD own flashcard reviews"
  on public.flashcard_reviews for all
  using (auth.uid() = user_id);

-- ============================================
-- CHAT MESSAGES
-- ============================================
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  source_chunks uuid[],
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can CRUD own chat messages"
  on public.chat_messages for all
  using (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

create policy "Users can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
