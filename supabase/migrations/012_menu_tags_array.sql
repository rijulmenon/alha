-- Migration 012: Replace single menu_tag TEXT with menu_tags TEXT[] array
-- Allows a product to belong to multiple filter categories simultaneously.

-- Drop old single-value column (added in 011)
ALTER TABLE products
    DROP COLUMN IF EXISTS menu_tag;

-- Add array column — NULL means untagged (shown under "All" only)
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS menu_tags TEXT[] DEFAULT NULL;

COMMENT ON COLUMN products.menu_tags IS
  'Array of filter tags. Valid values: Event Specials, Chocolate Desserts, Cookies, '
  'Cakes & Cheesecakes, Puddings & Trifles, Indian Desserts, Dubai Desserts, Italian Courses. '
  'NULL or empty = untagged (appears in All only).';

-- GIN index for fast array containment queries (@> operator)
CREATE INDEX IF NOT EXISTS idx_products_menu_tags ON products USING GIN(menu_tags);
