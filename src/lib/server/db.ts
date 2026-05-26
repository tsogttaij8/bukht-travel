import { mkdir, readFile, rename, unlink } from "node:fs/promises"
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

type ProcessWithDb = NodeJS.Process & {
  __buhktDbPromise?: Promise<PGlite>
}

async function createDb(): Promise<PGlite> {
  await mkdir(DB_DIR, { recursive: true })
  const db = await openDbWithRecovery()
  await initSchema(db)
  await seedDb(db, { users: LEGACY_USERS_PATH, loginCodes: LEGACY_LOGIN_CODES_PATH })
  return db
}

async function openDbWithRecovery(): Promise<PGlite> {
  try {
    return await openDb()
  } catch (error) {
    if (!isPGliteAbortError(error)) throw error

    const backupDir = path.join(process.cwd(), "data", `db.aborted-backup-${formatBackupTimestamp(new Date())}`)
    await rename(DB_DIR, backupDir)
    await mkdir(DB_DIR, { recursive: true })
    console.warn(`Recovered local PGlite DB by moving the aborted data directory to ${backupDir}.`, error)
    return openDb()
  }
}

async function openDb(): Promise<PGlite> {
  await removeStalePostmasterPid()
  const db = new PGlite(DB_DIR)
  await db.waitReady
  return db
}

async function removeStalePostmasterPid(): Promise<void> {
  const pidPath = path.join(DB_DIR, "postmaster.pid")

  let pidFile: string
  try {
    pidFile = await readFile(pidPath, "utf8")
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return
    throw error
  }

  const pid = Number.parseInt(pidFile.split(/\r?\n/, 1)[0] ?? "", 10)
  if (Number.isFinite(pid) && pid > 0 && isProcessRunning(pid)) return

  await unlink(pidPath).catch((error) => {
    if (isNodeError(error) && error.code === "ENOENT") return
    throw error
  })
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (isNodeError(error) && error.code === "ESRCH") return false
    return true
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error
}

function isPGliteAbortError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Aborted")
}

function formatBackupTimestamp(date: Date): string {
  const parts = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ]
  const [year, month, day, hour, minute, second] = parts.map((part) => String(part).padStart(2, "0"))
  return `${year}${month}${day}-${hour}${minute}${second}`
}

export function getDb(): Promise<PGlite> {
  const processWithDb = process as ProcessWithDb
  const existingPromise = processWithDb.__buhktDbPromise ?? globalThis.__buhktDbPromise

  if (!existingPromise) {
    const dbPromise = createDb().catch((error) => {
      processWithDb.__buhktDbPromise = undefined
      globalThis.__buhktDbPromise = undefined
      throw error
    })
    processWithDb.__buhktDbPromise = dbPromise
    globalThis.__buhktDbPromise = dbPromise
    return dbPromise
  }

  processWithDb.__buhktDbPromise = existingPromise
  globalThis.__buhktDbPromise = existingPromise
  return existingPromise
}
