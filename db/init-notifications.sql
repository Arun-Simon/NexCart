-- =============================================================================
-- NOTIFICATIONS SCHEMA INITIALISATION
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS notifications;

CREATE TABLE IF NOT EXISTS notifications.notification_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL UNIQUE,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'order.placed',
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON notifications.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON notifications.notifications(is_read);

-- ─── Seed default notification templates ─────────────────────────────────────
INSERT INTO notifications.notification_templates (type, title, body)
VALUES
  ('order.placed',    'Order Placed',    'Your order #{{orderId}} has been placed successfully! Total: ${{total}}.'),
  ('order.confirmed', 'Order Confirmed', 'Great news! Your order #{{orderId}} has been confirmed.'),
  ('order.shipped',   'Order Shipped',   'Your order #{{orderId}} is on its way!'),
  ('order.delivered', 'Order Delivered', 'Your order #{{orderId}} has been delivered. Enjoy!')
ON CONFLICT (type) DO NOTHING;
