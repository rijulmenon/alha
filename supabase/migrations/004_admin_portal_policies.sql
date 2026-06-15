-- =====================================================
-- ALHA Admin Portal - Temporary RLS Bypass for Development
-- =====================================================
-- This migration provides temporary policies to allow admin portal
-- operations without full authentication setup.
-- 
-- IMPORTANT: This is for DEVELOPMENT/INTERNAL USE ONLY
-- For production, implement proper Supabase Auth with admin roles
-- =====================================================

-- =====================================================
-- OPTION 1: Temporary Permissive Policies (Recommended for Development)
-- =====================================================
-- These policies allow INSERT/UPDATE/DELETE operations for development
-- They should be replaced with proper authentication in production

-- Drop existing restrictive admin policies
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can create posts" ON journal_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON journal_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON journal_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON journal_posts;

-- Create temporary permissive policies for products
CREATE POLICY "Temporary: Anyone can insert products"
    ON products FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Temporary: Anyone can update products"
    ON products FOR UPDATE
    USING (true);

CREATE POLICY "Temporary: Anyone can delete products"
    ON products FOR DELETE
    USING (true);

-- Allow viewing all products (including unavailable ones)
CREATE POLICY "Temporary: Anyone can view all products"
    ON products FOR SELECT
    USING (true);

-- Create temporary permissive policies for journal posts
CREATE POLICY "Temporary: Anyone can insert posts"
    ON journal_posts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Temporary: Anyone can update posts"
    ON journal_posts FOR UPDATE
    USING (true);

CREATE POLICY "Temporary: Anyone can delete posts"
    ON journal_posts FOR DELETE
    USING (true);

CREATE POLICY "Temporary: Anyone can view all posts"
    ON journal_posts FOR SELECT
    USING (true);

-- =====================================================
-- COMMENTS AND WARNINGS
-- =====================================================

COMMENT ON POLICY "Temporary: Anyone can insert products" ON products IS 
'DEVELOPMENT ONLY: Remove this policy and implement proper authentication before production deployment';

COMMENT ON POLICY "Temporary: Anyone can insert posts" ON journal_posts IS 
'DEVELOPMENT ONLY: Remove this policy and implement proper authentication before production deployment';

-- =====================================================
-- PRODUCTION MIGRATION INSTRUCTIONS
-- =====================================================
-- 
-- When ready for production, run this SQL to restore secure policies:
-- 
-- -- Remove temporary policies
-- DROP POLICY IF EXISTS "Temporary: Anyone can insert products" ON products;
-- DROP POLICY IF EXISTS "Temporary: Anyone can update products" ON products;
-- DROP POLICY IF EXISTS "Temporary: Anyone can delete products" ON products;
-- DROP POLICY IF EXISTS "Temporary: Anyone can view all products" ON products;
-- DROP POLICY IF EXISTS "Temporary: Anyone can insert posts" ON journal_posts;
-- DROP POLICY IF EXISTS "Temporary: Anyone can update posts" ON journal_posts;
-- DROP POLICY IF EXISTS "Temporary: Anyone can delete posts" ON journal_posts;
-- DROP POLICY IF EXISTS "Temporary: Anyone can view all posts" ON journal_posts;
-- 
-- -- Restore secure admin-only policies
-- CREATE POLICY "Admins can insert products"
--     ON products FOR INSERT
--     WITH CHECK (
--         auth.jwt() ->> 'role' = 'admin' OR
--         auth.jwt() ->> 'user_role' = 'admin'
--     );
-- 
-- CREATE POLICY "Admins can update products"
--     ON products FOR UPDATE
--     USING (
--         auth.jwt() ->> 'role' = 'admin' OR
--         auth.jwt() ->> 'user_role' = 'admin'
--     );
-- 
-- CREATE POLICY "Admins can delete products"
--     ON products FOR DELETE
--     USING (
--         auth.jwt() ->> 'role' = 'admin' OR
--         auth.jwt() ->> 'user_role' = 'admin'
--     );
-- 
-- CREATE POLICY "Admins can create posts"
--     ON journal_posts FOR INSERT
--     WITH CHECK (
--         auth.jwt() ->> 'role' = 'admin' OR
--         auth.jwt() ->> 'user_role' = 'admin'
--     );
-- 
-- CREATE POLICY "Admins can update posts"
--     ON journal_posts FOR UPDATE
--     USING (
--         auth.jwt() ->> 'role' = 'admin' OR
--         auth.jwt() ->> 'user_role' = 'admin'
--     );
-- 
-- CREATE POLICY "Admins can delete posts"
--     ON journal_posts FOR DELETE
--     USING (
--         auth.jwt() ->> 'role' = 'admin' OR
--         auth.jwt() ->> 'user_role' = 'admin'
--     );
-- 
-- CREATE POLICY "Admins can view all posts"
--     ON journal_posts FOR SELECT
--     USING (
--         auth.jwt() ->> 'role' = 'admin' OR
--         auth.jwt() ->> 'user_role' = 'admin'
--     );
-- 
-- CREATE POLICY "Anyone can view available products"
--     ON products FOR SELECT
--     USING (is_available = true);
-- 
-- CREATE POLICY "Anyone can view published posts"
--     ON journal_posts FOR SELECT
--     USING (is_published = true);

-- Made with Bob