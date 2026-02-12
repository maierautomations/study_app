-- Migration: Add summary column to documents table
-- Run this in the Supabase SQL Editor

ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary text;
