-- Phase E3: Fachbegriff-Glossar
-- Add glossary column to documents table for caching extracted terms

alter table public.documents add column if not exists glossary text;
