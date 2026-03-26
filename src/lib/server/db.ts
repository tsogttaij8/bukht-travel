import { randomUUID } from "node:crypto"
import { access, mkdir, readFile } from "node:fs/promises"
import path from "node:path"
import { PGlite } from "@electric-sql/pglite"

const DB_DIR = path.join(process.cwd(), "data", "db")
const LEGACY_USERS_PATH = path.join(process.cwd(), "data", "users.json")
const LEGACY_LOGIN_CODES_PATH = path.join(process.cwd(), "data", "login-codes.json")

declare global {
  var __buhktDbPromise: Promise<PGlite> | undefined
}

type LegacyUser = {
  id?: string
  name?: string
  email: string
  role?: "user" | "developer"
  createdAt?: string
}

type LegacyLoginCode = {
  email: string
  codeHash: string
  expiresAt: number
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  if (!(await fileExists(filePath))) return fallback

  try {
    const raw = await readFile(filePath, "utf8")
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function initSchema(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('user', 'developer')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_codes (
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at BIGINT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS login_codes_email_idx ON login_codes (email);

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

async function seedLegacyUsers(db: PGlite): Promise<void> {
  const countResult = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM users")

  if ((countResult.rows[0]?.count ?? 0) > 0) return

  const users = await readJsonFile<LegacyUser[]>(LEGACY_USERS_PATH, [])

  for (const user of users) {
    const email = user.email?.trim().toLowerCase()
    if (!email) continue

    await db.query(
      `INSERT INTO users (id, name, email, role, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [
        user.id ?? randomUUID(),
        user.name?.trim() || email.split("@")[0] || "User",
        email,
        user.role === "developer" ? "developer" : "user",
        user.createdAt ?? new Date().toISOString(),
      ]
    )
  }
}

async function seedLegacyLoginCodes(db: PGlite): Promise<void> {
  const countResult = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM login_codes")

  if ((countResult.rows[0]?.count ?? 0) > 0) return

  const codes = await readJsonFile<LegacyLoginCode[]>(LEGACY_LOGIN_CODES_PATH, [])
  const now = Date.now()

  for (const code of codes) {
    if (!code.email || code.expiresAt <= now) continue

    await db.query(
      `INSERT INTO login_codes (email, code_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [code.email.trim().toLowerCase(), code.codeHash, code.expiresAt]
    )
  }
}

async function seedDemoShipment(db: PGlite): Promise<void> {
  const countResult = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM shipments")

  if ((countResult.rows[0]?.count ?? 0) > 0) return

  const shipmentId = randomUUID()
  const now = new Date().toISOString()

  await db.query(
    `INSERT INTO shipments (
      id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      shipmentId,
      "1234",
      "Demo Customer",
      "demo@bukht.mn",
      "Beijing Warehouse",
      "Ulaanbaatar",
      "received",
      "Demo tracking record for initial launch setup.",
      now,
      now,
    ]
  )

  await db.query(
    `INSERT INTO shipment_events (id, shipment_id, status, details, location, happened_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [randomUUID(), shipmentId, "registered", "Shipment registered in the system.", "China", now, now]
  )

  await db.query(
    `INSERT INTO shipment_events (id, shipment_id, status, details, location, happened_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [randomUUID(), shipmentId, "received", "Cargo received at the Beijing warehouse.", "Beijing Warehouse", now, now]
  )
}

async function seedDemoProducts(db: PGlite): Promise<void> {
  const countResult = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM products")

  if ((countResult.rows[0]?.count ?? 0) > 0) return

  const now = new Date().toISOString()
  const demoProducts = [
    {
      name: "Kitchen Storage Set",
      category: "Гэр ахуй",
      price: "29,900 - 69,900 MNT",
      moq: "MOQ 12",
      origin: "Guangzhou",
      leadTime: "7-10 хоног",
      badge: "Hot deal",
      summary: "Гэр ахуйн дэлгүүрт шууд тавихад тохиромжтой, савлагаа цэвэрхэн storage багц.",
    },
    {
      name: "Mini Beauty Device",
      category: "Гоо сайхан",
      price: "48,000 - 118,000 MNT",
      moq: "MOQ 6",
      origin: "Shenzhen",
      leadTime: "5-8 хоног",
      badge: "Trending",
      summary: "Онлайн борлуулалтад тохиромжтой, жижиг овортой beauty gadget.",
    },
    {
      name: "Streetwear Capsule",
      category: "Хувцас",
      price: "39,000 - 92,000 MNT",
      moq: "MOQ 20",
      origin: "Hangzhou",
      leadTime: "8-12 хоног",
      badge: "New arrival",
      summary: "Залуу хэрэглэгчдэд чиглэсэн oversized загвартай capsule collection.",
    },
  ]

  for (const product of demoProducts) {
    await db.query(
      `INSERT INTO products (
        id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        randomUUID(),
        product.name,
        product.category,
        product.price,
        product.moq,
        product.origin,
        product.leadTime,
        product.badge,
        product.summary,
        now,
        now,
      ]
    )
  }
}

async function createDb(): Promise<PGlite> {
  await mkdir(DB_DIR, { recursive: true })

  const db = new PGlite(DB_DIR)
  await db.waitReady
  await initSchema(db)
  await seedLegacyUsers(db)
  await seedLegacyLoginCodes(db)
  await seedDemoShipment(db)
  await seedDemoProducts(db)

  return db
}

export function getDb(): Promise<PGlite> {
  if (!globalThis.__buhktDbPromise) {
    globalThis.__buhktDbPromise = createDb()
  }

  return globalThis.__buhktDbPromise
}
