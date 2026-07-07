-- =====================================================
-- Remove unused tables: journal_post_tags, journal_tags
-- These are not used by the frontend or admin portal.
-- Run this in Supabase SQL Editor.
-- =====================================================

-- Drop pivot table first (references both tags tables)
DROP TABLE IF EXISTS journal_post_tags CASCADE;

-- Drop tags lookup table
DROP TABLE IF EXISTS journal_tags CASCADE;
