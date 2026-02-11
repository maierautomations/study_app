-- ============================================
-- Migration 00002: Gamification System
-- ============================================
-- Adds XP, levels, streaks, achievements, and study session tracking.
-- Run this in the Supabase SQL Editor.

-- 1. Add gamification columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_study_date date,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 2. Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title_de text NOT NULL,
  description_de text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  xp_reward integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (read-only for authenticated users)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are readable by authenticated users"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- 3. Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'quiz_complete', 'flashcard_review', 'document_upload', 'chat_message'
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Pre-populate achievements
INSERT INTO achievements (key, title_de, description_de, icon, xp_reward, category) VALUES
  ('first_course',     'Erster Kurs',          'Erstelle deinen ersten Kurs',                          'book-open',    50,  'courses'),
  ('five_courses',     'Kurssammler',          'Erstelle 5 Kurse',                                     'library',      100, 'courses'),
  ('first_upload',     'Erstes Dokument',      'Lade dein erstes Dokument hoch',                       'upload',       50,  'documents'),
  ('ten_uploads',      'Fleißiger Uploader',   'Lade 10 Dokumente hoch',                               'files',        150, 'documents'),
  ('first_quiz',       'Quiz-Starter',         'Schließe dein erstes Quiz ab',                         'help-circle',  50,  'quizzes'),
  ('quiz_master',      'Quizmaster',           'Schließe 10 Quizzes ab',                               'brain',        200, 'quizzes'),
  ('perfect_quiz',     'Perfektionist',        'Erreiche 100% in einem Quiz',                          'star',         150, 'quizzes'),
  ('first_flashcard',  'Kartenlernen',         'Starte deine erste Flashcard-Session',                 'layers',       50,  'flashcards'),
  ('streak_3',         '3-Tage-Serie',         'Lerne 3 Tage in Folge',                                'flame',        100, 'streaks'),
  ('streak_7',         'Wochenserie',          'Lerne 7 Tage in Folge',                                'flame',        200, 'streaks'),
  ('streak_30',        'Monatsserie',          'Lerne 30 Tage in Folge',                               'flame',        500, 'streaks'),
  ('level_5',          'Aufsteiger',           'Erreiche Level 5',                                     'trending-up',  200, 'levels')
ON CONFLICT (key) DO NOTHING;

-- 6. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_created
  ON study_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON user_achievements (user_id);
