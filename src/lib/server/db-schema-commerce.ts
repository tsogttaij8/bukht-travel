export const commerceSchemaSql = `
  CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_per_user_idx ON carts (user_email) WHERE status = 'active';
  CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (cart_id, product_id)
  );
  CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON cart_items (cart_id);
  CREATE TABLE IF NOT EXISTS commerce_orders (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'cancelled')),
    total NUMERIC NOT NULL CHECK (total >= 0),
    currency TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS commerce_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    currency TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1)
  );
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    seller_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_message_at TEXT,
    UNIQUE (product_id, buyer_email, seller_email)
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    read_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages (conversation_id, created_at);
  ALTER TABLE messages ALTER COLUMN body DROP NOT NULL;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_path TEXT;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS original_filename TEXT;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS mime_type TEXT;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS width INTEGER;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS height INTEGER;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS duration_seconds REAL;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_kind TEXT;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS client_nonce TEXT;
  CREATE UNIQUE INDEX IF NOT EXISTS messages_sender_nonce_idx ON messages(sender_email, client_nonce) WHERE client_nonce IS NOT NULL;
`
