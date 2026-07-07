-- =====================================================
-- Journal is now Recipes only — no categories needed.
-- Drops journal_categories and the category_id FK
-- column from journal_posts.
-- Run in Supabase SQL Editor.
-- =====================================================

-- 1. Drop FK constraint and column from journal_posts
ALTER TABLE journal_posts DROP COLUMN IF EXISTS category_id;

-- 2. Drop dependent RLS policies on journal_categories
DROP POLICY IF EXISTS "Anyone can view categories"   ON journal_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON journal_categories;

-- 3. Drop the table itself
DROP TABLE IF EXISTS journal_categories CASCADE;
