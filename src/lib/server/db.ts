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

async function createDb(): Promise<PGlite> {
  await mkdir(DB_DIR, { recursive: true })

  const db = new PGlite(DB_DIR)
  await db.waitReady
  await initSchema(db)
  await seedLegacyUsers(db)
  await seedLegacyLoginCodes(db)
  await seedDemoShipment(db)

  return db
}

export function getDb(): Promise<PGlite> {
  if (!globalThis.__buhktDbPromise) {
    globalThis.__buhktDbPromise = createDb()
  }

  return globalThis.__buhktDbPromise
}
