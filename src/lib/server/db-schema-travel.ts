export const travelSchemaSql = `
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
    price_currency TEXT NOT NULL DEFAULT 'MNT',
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
  ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS price_currency TEXT NOT NULL DEFAULT 'MNT';
  ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS payment_settings TEXT NOT NULL DEFAULT '';
  ALTER TABLE travel_packages ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NOT NULL DEFAULT '';
  CREATE INDEX IF NOT EXISTS travel_packages_updated_at_idx ON travel_packages (updated_at);
  CREATE INDEX IF NOT EXISTS travel_packages_slug_idx ON travel_packages (slug);
  CREATE INDEX IF NOT EXISTS travel_packages_owner_id_idx ON travel_packages (owner_id);
  CREATE INDEX IF NOT EXISTS travel_packages_status_idx ON travel_packages (status);
`
