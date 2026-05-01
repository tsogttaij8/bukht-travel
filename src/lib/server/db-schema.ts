import type { PGlite } from "@electric-sql/pglite"

export async function initSchema(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('user', 'developer')),
      clerk_user_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
      created_at TEXT NOT NULL
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled'));
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'cargo_staff', 'travel_staff', 'esim_staff', 'finance_staff', 'support_staff', 'customer')),
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, role)
    );
    CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles (role);
    CREATE TABLE IF NOT EXISTS login_codes (email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at BIGINT NOT NULL);
    CREATE INDEX IF NOT EXISTS login_codes_email_idx ON login_codes (email);
    CREATE UNIQUE INDEX IF NOT EXISTS login_codes_email_unique_idx ON login_codes (email);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at BIGINT NOT NULL);
    DELETE FROM rate_limits WHERE reset_at <= ${Date.now()};
    CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits (reset_at);
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS products_updated_at_idx ON products (updated_at);
    CREATE TABLE IF NOT EXISTS travel_packages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      duration TEXT NOT NULL,
      group_size TEXT NOT NULL,
      transport TEXT NOT NULL,
      hotel TEXT NOT NULL,
      language TEXT NOT NULL,
      start_date TEXT NOT NULL,
      hero_image TEXT NOT NULL,
      gallery_images TEXT NOT NULL DEFAULT '[]',
      summary TEXT NOT NULL,
      adult_price INTEGER NOT NULL,
      child_price INTEGER NOT NULL,
      infant_price INTEGER NOT NULL,
      single_room_price INTEGER NOT NULL,
      included TEXT NOT NULL DEFAULT '[]',
      excluded TEXT NOT NULL DEFAULT '[]',
      itinerary TEXT NOT NULL DEFAULT '[]',
      warning TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS travel_packages_updated_at_idx ON travel_packages (updated_at);
    CREATE INDEX IF NOT EXISTS travel_packages_slug_idx ON travel_packages (slug);
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      company_name TEXT NOT NULL DEFAULT '',
      telegram_handle TEXT NOT NULL DEFAULT '',
      customer_types TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
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
  `)
}
