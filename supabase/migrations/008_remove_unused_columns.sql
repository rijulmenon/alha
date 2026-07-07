-- =====================================================
-- Remove unused user_id columns
-- Drops all dependent RLS policies first, then the
-- columns, then installs clean replacement policies.
-- Run in Supabase SQL Editor.
-- =====================================================

-- ─── 1. Drop every policy that touches user_id ───────────

-- cart_items (4 policies reference user_id)
DROP POLICY IF EXISTS "Users can view their own cart items"  ON cart_items;
DROP POLICY IF EXISTS "Users can add items to their cart"    ON cart_items;
DROP POLICY IF EXISTS "Users can update their cart items"    ON cart_items;
DROP POLICY IF EXISTS "Users can delete their cart items"    ON cart_items;

-- orders (1 policy references user_id directly)
DROP POLICY IF EXISTS "Users can view their own orders"      ON orders;

-- order_items (1 policy references orders.user_id via subquery)
DROP POLICY IF EXISTS "Users can view their order items"     ON order_items;

-- ─── 2. Drop the unused columns ──────────────────────────

ALTER TABLE cart_items DROP COLUMN IF EXISTS user_id;
ALTER TABLE orders     DROP COLUMN IF EXISTS user_id;

-- ─── 3. Replacement RLS policies ─────────────────────────

-- cart_items: session-based, open to all (session_id scopes in JS)
CREATE POLICY "Session cart: select"
  ON cart_items FOR SELECT USING (true);

CREATE POLICY "Session cart: insert"
  ON cart_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Session cart: update"
  ON cart_items FOR UPDATE USING (true);

CREATE POLICY "Session cart: delete"
  ON cart_items FOR DELETE USING (true);

-- orders: guest checkout is open; customers can look up by email
CREATE POLICY "Anyone can view orders by email"
  ON orders FOR SELECT
  USING (customer_email = auth.jwt() ->> 'email');

-- order_items: readable if the parent order belongs to the requester's email
CREATE POLICY "Customers can view their order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.customer_email = auth.jwt() ->> 'email'
    )
  );
