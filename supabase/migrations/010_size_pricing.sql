-- Migration 010: Add size-based pricing columns to products table
-- Replaces the single `price` field concept with three size tiers.
-- `price` is kept as-is (used as fallback / legacy).
-- New columns hold per-size prices; NULL = not offered at that size.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS price_small   DECIMAL(10, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS price_medium  DECIMAL(10, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS price_large   DECIMAL(10, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pieces_small  INTEGER        DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pieces_medium INTEGER        DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pieces_large  INTEGER        DEFAULT NULL;

-- Also add selected_size snapshot to order_items so orders capture the chosen size
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS selected_size VARCHAR(20) DEFAULT NULL;

-- Add selected_size to cart_items for Supabase-synced carts
ALTER TABLE cart_items
    ADD COLUMN IF NOT EXISTS selected_size VARCHAR(20) DEFAULT NULL;

-- Comment to document the intent
COMMENT ON COLUMN products.price_small   IS 'Price in AED for the Small size option. NULL if size not offered.';
COMMENT ON COLUMN products.price_medium  IS 'Price in AED for the Medium size option. NULL if size not offered.';
COMMENT ON COLUMN products.price_large   IS 'Price in AED for the Large size option. NULL if size not offered.';
COMMENT ON COLUMN products.pieces_small  IS 'Number of pieces included in the Small size. NULL = not specified.';
COMMENT ON COLUMN products.pieces_medium IS 'Number of pieces included in the Medium size. NULL = not specified.';
COMMENT ON COLUMN products.pieces_large  IS 'Number of pieces included in the Large size. NULL = not specified.';
COMMENT ON COLUMN order_items.selected_size IS 'Size chosen by customer: Small, Medium, or Large.';
COMMENT ON COLUMN cart_items.selected_size  IS 'Size chosen by customer: Small, Medium, or Large.';
