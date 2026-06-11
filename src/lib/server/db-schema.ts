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
    CREATE TABLE IF NOT EXISTS role_invites (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      roles TEXT NOT NULL,
      invited_by_email TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
      created_at TEXT NOT NULL,
      accepted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS role_invites_email_idx ON role_invites (email);
    CREATE INDEX IF NOT EXISTS role_invites_status_idx ON role_invites (status);
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
      buyer_name TEXT NOT NULL,
      buyer_contact TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS commerce_purchase_requests_product_id_idx ON commerce_purchase_requests (product_id);
    CREATE INDEX IF NOT EXISTS commerce_purchase_requests_status_idx ON commerce_purchase_requests (status);
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
    CREATE TABLE IF NOT EXISTS travel_packages (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_description TEXT NOT NULL DEFAULT '',
      full_description TEXT NOT NULL DEFAULT '',
      destination TEXT NOT NULL DEFAULT '',
      start_location TEXT NOT NULL DEFAULT '',
      end_location TEXT NOT NULL DEFAULT '',
      map_coordinates TEXT NOT NULL DEFAULT '',
      transportation_types TEXT NOT NULL DEFAULT '[]',
      price INTEGER NOT NULL DEFAULT 0,
      max_participants INTEGER NOT NULL DEFAULT 0,
      payment_settings TEXT NOT NULL DEFAULT '',
      cancellation_policy TEXT NOT NULL DEFAULT '',
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
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS owner_id TEXT NOT NULL DEFAULT '';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published'));
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS short_description TEXT NOT NULL DEFAULT '';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS full_description TEXT NOT NULL DEFAULT '';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS destination TEXT NOT NULL DEFAULT '';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS start_location TEXT NOT NULL DEFAULT '';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS end_location TEXT NOT NULL DEFAULT '';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS map_coordinates TEXT NOT NULL DEFAULT '';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS transportation_types TEXT NOT NULL DEFAULT '[]';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS payment_settings TEXT NOT NULL DEFAULT '';
    ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NOT NULL DEFAULT '';
    CREATE INDEX IF NOT EXISTS travel_packages_updated_at_idx ON travel_packages (updated_at);
    CREATE INDEX IF NOT EXISTS travel_packages_slug_idx ON travel_packages (slug);
    CREATE INDEX IF NOT EXISTS travel_packages_owner_id_idx ON travel_packages (owner_id);
    CREATE INDEX IF NOT EXISTS travel_packages_status_idx ON travel_packages (status);
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
