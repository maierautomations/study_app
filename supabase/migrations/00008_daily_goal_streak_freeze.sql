-- ============================================
-- Migration 00008: Daily Learning Goal + Streak Freeze
-- ============================================
-- Adds daily goal tracking columns and streak freeze (Pro) columns to profiles.

-- 1. Daily Learning Goal
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS daily_goal_minutes integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS daily_goal_progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_goal_date date;

-- 2. Streak Freeze (Pro only)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_freezes_remaining integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_freezes_reset_at timestamptz NOT NULL DEFAULT now();
