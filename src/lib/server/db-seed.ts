import { randomUUID } from "node:crypto"
import { access, readFile } from "node:fs/promises"
import type { PGlite } from "@electric-sql/pglite"

type LegacyUser = { id?: string; name?: string; email: string; role?: "user" | "developer"; roles?: string[]; createdAt?: string }
type LegacyLoginCode = { email: string; codeHash: string; expiresAt: number }

const validRoles = ["owner", "cargo_staff", "travel_staff", "esim_staff", "finance_staff", "support_staff", "customer"]

export async function seedDb(db: PGlite, paths: { users: string; loginCodes: string }): Promise<void> {
  await seedLegacyUsers(db, paths.users)
  await seedLegacyLoginCodes(db, paths.loginCodes)
  await seedDemoShipment(db)
  await seedDemoProducts(db)
}

async function seedLegacyUsers(db: PGlite, usersPath: string): Promise<void> {
  if ((await countRows(db, "users")) > 0) return
  const users = await readJsonFile<LegacyUser[]>(usersPath, [])
  for (const user of users) {
    const email = user.email?.trim().toLowerCase()
    if (!email) continue
    await db.query(
      `INSERT INTO users (id, name, email, role, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING`,
      [user.id ?? randomUUID(), user.name?.trim() || email.split("@")[0] || "User", email, user.role === "developer" ? "developer" : "user", user.createdAt ?? new Date().toISOString()]
    )
    await seedLegacyUserRoles(db, email, user)
  }
}

async function seedLegacyUserRoles(db: PGlite, email: string, user: LegacyUser): Promise<void> {
  const userResult = await db.query<{ id: string }>("SELECT id FROM users WHERE email = $1 LIMIT 1", [email])
  const userId = userResult.rows[0]?.id
  if (!userId) return
  const roles = user.roles?.length ? user.roles : [user.role === "developer" ? "owner" : "customer"]
  for (const role of roles.filter((role) => validRoles.includes(role))) {
    await db.query(
      `INSERT INTO user_roles (user_id, role, created_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, role) DO NOTHING`,
      [userId, role, new Date().toISOString()]
    )
  }
}

async function seedLegacyLoginCodes(db: PGlite, loginCodesPath: string): Promise<void> {
  if ((await countRows(db, "login_codes")) > 0) return
  const codes = await readJsonFile<LegacyLoginCode[]>(loginCodesPath, [])
  const now = Date.now()
  for (const code of codes) {
    if (!code.email || code.expiresAt <= now) continue
    await db.query(`INSERT INTO login_codes (email, code_hash, expires_at) VALUES ($1, $2, $3)`, [code.email.trim().toLowerCase(), code.codeHash, code.expiresAt])
  }
}

async function seedDemoShipment(db: PGlite): Promise<void> {
  if ((await countRows(db, "shipments")) > 0) return
  const shipmentId = randomUUID()
  const now = new Date().toISOString()
  await db.query(
    `INSERT INTO shipments (id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [shipmentId, "1234", "Demo Customer", "demo@bukht.mn", "Beijing Warehouse", "Ulaanbaatar", "received", "Demo tracking record for initial launch setup.", now, now]
  )
  await db.query(`INSERT INTO shipment_events (id, shipment_id, status, details, location, happened_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [randomUUID(), shipmentId, "registered", "Shipment registered in the system.", "China", now, now])
  await db.query(`INSERT INTO shipment_events (id, shipment_id, status, details, location, happened_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [randomUUID(), shipmentId, "received", "Cargo received at the Beijing warehouse.", "Beijing Warehouse", now, now])
}

async function seedDemoProducts(db: PGlite): Promise<void> {
  if ((await countRows(db, "products")) > 0) return
  const now = new Date().toISOString()
  for (const product of demoProducts) {
    await db.query(
      `INSERT INTO products (id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [randomUUID(), product.name, product.category, product.price, product.moq, product.origin, product.leadTime, product.badge, product.summary, now, now]
    )
  }
}

async function countRows(db: PGlite, table: string): Promise<number> {
  const result = await db.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM ${table}`)
  return result.rows[0]?.count ?? 0
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    await access(filePath)
    return JSON.parse(await readFile(filePath, "utf8")) as T
  } catch {
    return fallback
  }
}

const demoProducts = [
  { name: "Kitchen Storage Set", category: "Гэр ахуй", price: "29,900 - 69,900 MNT", moq: "MOQ 12", origin: "Guangzhou", leadTime: "7-10 хоног", badge: "Hot deal", summary: "Гэр ахуйн дэлгүүрт тохиромжтой storage багц." },
  { name: "Mini Beauty Device", category: "Гоо сайхан", price: "48,000 - 118,000 MNT", moq: "MOQ 6", origin: "Shenzhen", leadTime: "5-8 хоног", badge: "Trending", summary: "Онлайн борлуулалтад тохиромжтой beauty gadget." },
  { name: "Streetwear Capsule", category: "Хувцас", price: "39,000 - 92,000 MNT", moq: "MOQ 20", origin: "Hangzhou", leadTime: "8-12 хоног", badge: "New arrival", summary: "Залуу хэрэглэгчдэд чиглэсэн capsule collection." },
]

