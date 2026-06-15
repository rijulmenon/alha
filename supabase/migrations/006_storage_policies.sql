-- =====================================================
-- ALHA Storage Bucket Policies
-- Run this in Supabase SQL Editor after creating
-- the 'products' and 'journal' storage buckets.
-- =====================================================

-- Products bucket: public read, admin write
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'products' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'products' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'products' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Journal bucket: public read, admin write
CREATE POLICY "Public can view journal images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'journal');

CREATE POLICY "Admins can upload journal images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'journal' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update journal images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'journal' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete journal images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'journal' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
