import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { StoredTravelPackage } from "./travel-package-model"

export const LOCAL_TRAVEL_PACKAGES_PATH = path.join(process.cwd(), "data", "travel-packages.json")

export async function readLocalTravelPackages(): Promise<StoredTravelPackage[]> {
  try {
    const raw = await readFile(LOCAL_TRAVEL_PACKAGES_PATH, "utf8")
    const parsed = JSON.parse(raw) as StoredTravelPackage[]
    return Array.isArray(parsed) ? parsed.map(normalizeLocalTravelPackage) : []
  } catch {
    return []
  }
}

export async function saveLocalTravelPackage(item: StoredTravelPackage): Promise<void> {
  const current = await readLocalTravelPackages()
  await writeTravelPackages([item, ...current])
}

export async function replaceLocalTravelPackage(item: StoredTravelPackage): Promise<void> {
  const current = await readLocalTravelPackages()
  await writeTravelPackages(current.map((existing) => existing.id === item.id ? item : existing))
}

export async function deleteLocalTravelPackage(ownerId: string, id: string): Promise<void> {
  const current = await readLocalTravelPackages()
  await writeTravelPackages(current.filter((item) => item.id !== id || item.ownerId !== ownerId))
}

function writeTravelPackages(items: StoredTravelPackage[]): Promise<void> {
  return writeFile(LOCAL_TRAVEL_PACKAGES_PATH, JSON.stringify(items, null, 2), "utf8")
}

function normalizeLocalTravelPackage(item: StoredTravelPackage): StoredTravelPackage {
  return { ...item, priceCurrency: item.priceCurrency === "CNY" ? "CNY" : "MNT" }
}
