import { randomUUID } from "node:crypto"
import { getDb } from "./db"

export type StoredEsimPackage = {
  id: string
  name: string
  dataAmount: string
  validity: string
  price: string
  note: string
  badge: string
  createdAt: string
  updatedAt: string
}

type EsimPackageRow = {
  id: string
  name: string
  data_amount: string
  validity: string
  price: string
  note: string
  badge: string
  created_at: string
  updated_at: string
}

const select = "id, name, data_amount, validity, price, note, badge, created_at, updated_at"

export async function listEsimPackages(): Promise<StoredEsimPackage[]> {
  const db = await getDb()
  const result = await db.query<EsimPackageRow>(`SELECT ${select} FROM esim_packages ORDER BY updated_at DESC`)
  return result.rows.map(mapPackage)
}

export async function createEsimPackage(input: {
  name: string
  dataAmount: string
  validity: string
  price: string
  note: string
  badge: string
}): Promise<StoredEsimPackage> {
  const db = await getDb()
  const now = new Date().toISOString()
  const result = await db.query<EsimPackageRow>(
    `INSERT INTO esim_packages (id, name, data_amount, validity, price, note, badge, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING ${select}`,
    [randomUUID(), input.name.trim(), input.dataAmount.trim(), input.validity.trim(), input.price.trim(), input.note.trim(), input.badge.trim(), now, now]
  )
  return mapPackage(result.rows[0])
}

function mapPackage(row: EsimPackageRow): StoredEsimPackage {
  return {
    id: row.id,
    name: row.name,
    dataAmount: row.data_amount,
    validity: row.validity,
    price: row.price,
    note: row.note,
    badge: row.badge,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
