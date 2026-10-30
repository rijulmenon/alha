-- Migration 011: Add menu_tag column to products for frontend filter sidebar
-- Stores a single tag string matching one of the defined filter categories.
-- NULL means the product appears only under "All".

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS menu_tag TEXT DEFAULT NULL;

COMMENT ON COLUMN products.menu_tag IS
  'Filter tag shown in menu sidebar. One of: Event Specials, Chocolate Desserts, Cookies, '
  'Cakes & Cheesecakes, Puddings & Trifles, Indian Desserts, Dubai Desserts, Italian Courses. '
  'NULL = untagged (appears in All only).';

-- Index for fast tag filtering
CREATE INDEX IF NOT EXISTS idx_products_menu_tag ON products(menu_tag);
