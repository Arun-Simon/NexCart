-- =============================================================================
-- PRODUCTS SCHEMA INITIALISATION
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS products;

CREATE TABLE IF NOT EXISTS products.categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products.products (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID         REFERENCES products.categories(id) ON DELETE SET NULL,
  name         TEXT         NOT NULL,
  description  TEXT,
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  image_url    TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products.inventory (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL UNIQUE REFERENCES products.products(id) ON DELETE CASCADE,
  quantity    INT         NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category   ON products.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active  ON products.products(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_product   ON products.inventory(product_id);
