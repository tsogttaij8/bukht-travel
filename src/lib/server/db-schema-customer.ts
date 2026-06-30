export const customerSchemaSql = `
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    company_name TEXT NOT NULL DEFAULT '',
    telegram_handle TEXT NOT NULL DEFAULT '',
    customer_types TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';
  CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles (email);
  CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('travel', 'cargo', 'esim', 'product_sourcing')),
    status TEXT NOT NULL CHECK (status IN ('new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled')),
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    budget TEXT NOT NULL DEFAULT '',
    travel_date TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS service_requests_user_id_idx ON service_requests (user_id);
  CREATE INDEX IF NOT EXISTS service_requests_status_idx ON service_requests (status);
`
