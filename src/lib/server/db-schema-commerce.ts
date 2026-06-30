export const commerceSchemaSql = `
  CREATE TABLE IF NOT EXISTS commerce_products (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'MNT',
    category TEXT NOT NULL DEFAULT '',
    condition TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    seller_name TEXT NOT NULL DEFAULT '',
    seller_contact TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'hidden')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS commerce_products_owner_id_idx ON commerce_products (owner_id);
  CREATE INDEX IF NOT EXISTS commerce_products_status_idx ON commerce_products (status);
  CREATE INDEX IF NOT EXISTS commerce_products_updated_at_idx ON commerce_products (updated_at);
  CREATE TABLE IF NOT EXISTS commerce_purchase_requests (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES commerce_products(id) ON DELETE CASCADE,
    buyer_id TEXT NOT NULL DEFAULT '',
    buyer_email TEXT NOT NULL DEFAULT '',
    buyer_name TEXT NOT NULL,
    buyer_contact TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  ALTER TABLE commerce_purchase_requests ADD COLUMN IF NOT EXISTS buyer_id TEXT NOT NULL DEFAULT '';
  ALTER TABLE commerce_purchase_requests ADD COLUMN IF NOT EXISTS buyer_email TEXT NOT NULL DEFAULT '';
  CREATE INDEX IF NOT EXISTS commerce_purchase_requests_product_id_idx ON commerce_purchase_requests (product_id);
  CREATE INDEX IF NOT EXISTS commerce_purchase_requests_buyer_id_idx ON commerce_purchase_requests (buyer_id);
  CREATE INDEX IF NOT EXISTS commerce_purchase_requests_buyer_email_idx ON commerce_purchase_requests (buyer_email);
  CREATE INDEX IF NOT EXISTS commerce_purchase_requests_status_idx ON commerce_purchase_requests (status);
`
