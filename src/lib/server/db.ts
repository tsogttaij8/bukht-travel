import { mkdir } from "node:fs/promises"
import path from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { initSchema } from "./db-schema"
import { seedDb } from "./db-seed"

const DB_DIR = path.join(process.cwd(), "data", "db")
const LEGACY_USERS_PATH = path.join(process.cwd(), "data", "users.json")
const LEGACY_LOGIN_CODES_PATH = path.join(process.cwd(), "data", "login-codes.json")

declare global {
  var __buhktDbPromise: Promise<PGlite> | undefined
}

async function createDb(): Promise<PGlite> {
  await mkdir(DB_DIR, { recursive: true })
  const db = new PGlite(DB_DIR)
  await db.waitReady
  await initSchema(db)
  await seedDb(db, { users: LEGACY_USERS_PATH, loginCodes: LEGACY_LOGIN_CODES_PATH })
  return db
}

export function getDb(): Promise<PGlite> {
  if (!globalThis.__buhktDbPromise) {
    globalThis.__buhktDbPromise = createDb().catch((error) => {
      globalThis.__buhktDbPromise = undefined
      throw error
    })
  }
  return globalThis.__buhktDbPromise
}
