-- =============================================================================
-- ORDERS SCHEMA INITIALISATION
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS orders;

CREATE TABLE IF NOT EXISTS orders.cart (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders.cart_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID        NOT NULL REFERENCES orders.cart(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL,
  product_name TEXT       NOT NULL,
  price       NUMERIC(12,2) NOT NULL,
  quantity    INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders.orders (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL,
  status       TEXT         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  total_amount NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders.order_items (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID          NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
  product_id   UUID          NOT NULL,
  product_name TEXT          NOT NULL,
  price        NUMERIC(12,2) NOT NULL,
  quantity     INT           NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON orders.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON orders.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id          ON orders.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id    ON orders.cart_items(cart_id);
