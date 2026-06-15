-- =====================================================
-- ALHA Admin Portal - Production RLS Policies
-- =====================================================
-- This migration sets up secure Row Level Security policies
-- for production use with Supabase Authentication.
-- 
-- PREREQUISITES:
-- 1. Admin user created in Supabase Auth
-- 2. User metadata set: {"role": "admin"}
-- 3. Storage buckets created (products, journal)
-- =====================================================

-- =====================================================
-- DROP TEMPORARY DEVELOPMENT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Temporary: Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Temporary: Anyone can update products" ON products;
DROP POLICY IF EXISTS "Temporary: Anyone can delete products" ON products;
DROP POLICY IF EXISTS "Temporary: Anyone can view all products" ON products;
DROP POLICY IF EXISTS "Temporary: Anyone can insert posts" ON journal_posts;
DROP POLICY IF EXISTS "Temporary: Anyone can update posts" ON journal_posts;
DROP POLICY IF EXISTS "Temporary: Anyone can delete posts" ON journal_posts;
DROP POLICY IF EXISTS "Temporary: Anyone can view all posts" ON journal_posts;

-- =====================================================
-- PRODUCTS POLICIES (Production Secure)
-- =====================================================

-- Public can view available products
CREATE POLICY "Public can view available products"
    ON products FOR SELECT
    USING (is_available = true);

-- Admins can view all products (including unavailable)
CREATE POLICY "Admins can view all products"
    ON products FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
    );

-- Admins can insert products
CREATE POLICY "Admins can insert products"
    ON products FOR INSERT
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
    );

-- Admins can update products
CREATE POLICY "Admins can update products"
    ON products FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
    );

-- Admins can delete products
CREATE POLICY "Admins can delete products"
    ON products FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
    );

-- =====================================================
-- JOURNAL POSTS POLICIES (Production Secure)
-- =====================================================

-- Public can view published posts
CREATE POLICY "Public can view published posts"
    ON journal_posts FOR SELECT
    USING (is_published = true);

-- Admins can view all posts (including drafts)
CREATE POLICY "Admins can view all posts"
    ON journal_posts FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
    );

-- Admins can create posts
CREATE POLICY "Admins can create posts"
    ON journal_posts FOR INSERT
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
    );

-- Admins can update posts
CREATE POLICY "Admins can update posts"
    ON journal_posts FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
    );

-- Admins can delete posts
CREATE POLICY "Admins can delete posts"
    ON journal_posts FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'user_role') = 'admin'
    );

-- =====================================================
-- STORAGE POLICIES (For Image Uploads)
-- =====================================================
-- Note: These need to be run separately in the Storage section
-- or via the Supabase Dashboard

-- For products bucket:
-- CREATE POLICY "Admins can upload product images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     bucket_id = 'products' AND
--     (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- );

-- CREATE POLICY "Public can view product images"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'products');

-- CREATE POLICY "Admins can delete product images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--     bucket_id = 'products' AND
--     (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- );

-- For journal bucket:
-- CREATE POLICY "Admins can upload journal images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     bucket_id = 'journal' AND
--     (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- );

-- CREATE POLICY "Public can view journal images"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'journal');

-- CREATE POLICY "Admins can delete journal images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--     bucket_id = 'journal' AND
--     (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify policies are active:

-- Check products policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'products'
-- ORDER BY policyname;

-- Check journal_posts policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'journal_posts'
-- ORDER BY policyname;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Public can view available products" ON products IS 
'Allows anyone to view products that are marked as available';

COMMENT ON POLICY "Admins can view all products" ON products IS 
'Allows authenticated admin users to view all products including unavailable ones';

COMMENT ON POLICY "Public can view published posts" ON journal_posts IS 
'Allows anyone to view journal posts that are published';

COMMENT ON POLICY "Admins can view all posts" ON journal_posts IS 
'Allows authenticated admin users to view all posts including drafts';

-- Made with Bob - Production Version