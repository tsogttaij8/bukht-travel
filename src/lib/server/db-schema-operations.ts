export const operationsSchemaSql = `
  CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    tracking_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    current_status TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS shipments_tracking_code_idx ON shipments (tracking_code);
  CREATE TABLE IF NOT EXISTS shipment_events (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    details TEXT NOT NULL,
    location TEXT NOT NULL,
    happened_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS shipment_events_shipment_id_idx ON shipment_events (shipment_id);
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    moq TEXT NOT NULL,
    origin TEXT NOT NULL,
    lead_time TEXT NOT NULL,
    badge TEXT NOT NULL,
    summary TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    seller_name TEXT NOT NULL DEFAULT 'BUKHT',
    seller_email TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_name TEXT NOT NULL DEFAULT 'BUKHT';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_email TEXT NOT NULL DEFAULT '';
  CREATE INDEX IF NOT EXISTS products_updated_at_idx ON products (updated_at);
  CREATE TABLE IF NOT EXISTS esim_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data_amount TEXT NOT NULL,
    validity TEXT NOT NULL,
    price TEXT NOT NULL,
    note TEXT NOT NULL,
    badge TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS esim_packages_updated_at_idx ON esim_packages (updated_at);
`
