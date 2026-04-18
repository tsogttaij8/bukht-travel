import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"
import { findUserByEmail, type StoredUser } from "./user-store"

export type CustomerType = "traveler" | "merchant" | "cargo_customer" | "esim_customer"
export type ServiceType = "travel" | "cargo" | "esim" | "product_sourcing"
export type ServiceRequestStatus = "new" | "contacted" | "quoted" | "confirmed" | "completed" | "cancelled"

export type StoredUserProfile = {
  userId: string
  email: string
  phone: string
  companyName: string
  telegramHandle: string
  customerTypes: CustomerType[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type StoredServiceRequest = {
  id: string
  userId: string
  serviceType: ServiceType
  status: ServiceRequestStatus
  title: string
  details: string
  budget: string
  travelDate: string
  createdAt: string
  updatedAt: string
}

type UserProfileRow = {
  user_id: string
  email: string
  phone: string
  company_name: string
  telegram_handle: string
  customer_types: string | CustomerType[]
  notes: string
  created_at: string
  updated_at: string
}

type ServiceRequestRow = {
  id: string
  user_id: string
  service_type: ServiceType
  status: ServiceRequestStatus
  title: string
  details: string
  budget: string
  travel_date: string
  created_at: string
  updated_at: string
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    const parts = [
      typeof maybeError.message === "string" ? maybeError.message : "",
      typeof maybeError.details === "string" ? maybeError.details : "",
      typeof maybeError.hint === "string" ? maybeError.hint : "",
      typeof maybeError.code === "string" ? `code: ${maybeError.code}` : "",
    ].filter(Boolean)
    if (parts.length > 0) return parts.join(" | ")
  }
  return "Unknown error"
}

function shouldFallbackToLocalDb(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase()

  return (
    message.includes("fetch failed") ||
    message.includes("getaddrinfo enotfound") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("network") ||
    message.includes("dns")
  )
}

function normalizeCustomerTypes(input: unknown): CustomerType[] {
  const validTypes: CustomerType[] = ["traveler", "merchant", "cargo_customer", "esim_customer"]

  if (Array.isArray(input)) {
    return input.filter((item): item is CustomerType => validTypes.includes(item as CustomerType))
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input) as unknown
      return normalizeCustomerTypes(parsed)
    } catch {
      return []
    }
  }

  return []
}

function mapUserProfile(row: UserProfileRow): StoredUserProfile {
  return {
    userId: row.user_id,
    email: row.email,
    phone: row.phone,
    companyName: row.company_name,
    telegramHandle: row.telegram_handle,
    customerTypes: normalizeCustomerTypes(row.customer_types),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapServiceRequest(row: ServiceRequestRow): StoredServiceRequest {
  return {
    id: row.id,
    userId: row.user_id,
    serviceType: row.service_type,
    status: row.status,
    title: row.title,
    details: row.details,
    budget: row.budget,
    travelDate: row.travel_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function ensureUserProfile(user: StoredUser): Promise<StoredUserProfile> {
  const now = new Date().toISOString()

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          phone: "",
          company_name: "",
          telegram_handle: "",
          customer_types: [],
          notes: "",
          created_at: now,
          updated_at: now,
        })
        .select("user_id, email, phone, company_name, telegram_handle, customer_types, notes, created_at, updated_at")
        .single()

      if (!error && data) return mapUserProfile(data as UserProfileRow)
      if (error?.code !== "23505") throw error

      const existing = await findUserProfileByEmail(user.email)
      if (existing) return existing
      throw error
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Saving user profile to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const result = await db.query<UserProfileRow>(
    `INSERT INTO user_profiles (user_id, email, phone, company_name, telegram_handle, customer_types, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id)
     DO UPDATE SET email = EXCLUDED.email
     RETURNING user_id, email, phone, company_name, telegram_handle, customer_types, notes, created_at, updated_at`,
    [user.id, user.email, "", "", "", JSON.stringify([]), "", now, now]
  )

  return mapUserProfile(result.rows[0] as UserProfileRow)
}

export async function findUserProfileByEmail(email: string): Promise<StoredUserProfile | null> {
  const normalizedEmail = email.trim().toLowerCase()

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id, email, phone, company_name, telegram_handle, customer_types, notes, created_at, updated_at")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (error) throw error
    return data ? mapUserProfile(data as UserProfileRow) : null
  }

  const db = await getDb()
  const result = await db.query<UserProfileRow>(
    `SELECT user_id, email, phone, company_name, telegram_handle, customer_types, notes, created_at, updated_at
     FROM user_profiles
     WHERE email = $1
     LIMIT 1`,
    [normalizedEmail]
  )

  return result.rows[0] ? mapUserProfile(result.rows[0]) : null
}

export async function upsertUserProfileByEmail(input: {
  email: string
  phone?: string
  companyName?: string
  telegramHandle?: string
  customerTypes?: CustomerType[]
  notes?: string
}): Promise<StoredUserProfile> {
  const user = await findUserByEmail(input.email)
  if (!user) throw new Error("Хэрэглэгч олдсонгүй")

  const existing = await ensureUserProfile(user)
  const now = new Date().toISOString()
  const nextProfile: StoredUserProfile = {
    ...existing,
    phone: input.phone?.trim() ?? existing.phone,
    companyName: input.companyName?.trim() ?? existing.companyName,
    telegramHandle: input.telegramHandle?.trim() ?? existing.telegramHandle,
    customerTypes: input.customerTypes ?? existing.customerTypes,
    notes: input.notes?.trim() ?? existing.notes,
    updatedAt: now,
  }

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from("user_profiles")
      .update({
        phone: nextProfile.phone,
        company_name: nextProfile.companyName,
        telegram_handle: nextProfile.telegramHandle,
        customer_types: nextProfile.customerTypes,
        notes: nextProfile.notes,
        updated_at: nextProfile.updatedAt,
      })
      .eq("email", user.email)

    if (error) throw error
    return nextProfile
  }

  const db = await getDb()
  await db.query(
    `UPDATE user_profiles
     SET phone = $1, company_name = $2, telegram_handle = $3, customer_types = $4, notes = $5, updated_at = $6
     WHERE email = $7`,
    [
      nextProfile.phone,
      nextProfile.companyName,
      nextProfile.telegramHandle,
      JSON.stringify(nextProfile.customerTypes),
      nextProfile.notes,
      nextProfile.updatedAt,
      user.email,
    ]
  )

  return nextProfile
}

export async function listServiceRequestsByEmail(email: string): Promise<StoredServiceRequest[]> {
  const user = await findUserByEmail(email)
  if (!user) return []

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("service_requests")
      .select("id, user_id, service_type, status, title, details, budget, travel_date, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data ?? []).map((item) => mapServiceRequest(item as ServiceRequestRow))
  }

  const db = await getDb()
  const result = await db.query<ServiceRequestRow>(
    `SELECT id, user_id, service_type, status, title, details, budget, travel_date, created_at, updated_at
     FROM service_requests
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [user.id]
  )

  return result.rows.map(mapServiceRequest)
}

export async function createServiceRequest(input: {
  email: string
  serviceType: ServiceType
  title: string
  details: string
  budget?: string
  travelDate?: string
}): Promise<StoredServiceRequest> {
  const user = await findUserByEmail(input.email)
  if (!user) throw new Error("Хэрэглэгч олдсонгүй")

  await ensureUserProfile(user)

  const now = new Date().toISOString()
  const request: StoredServiceRequest = {
    id: randomUUID(),
    userId: user.id,
    serviceType: input.serviceType,
    status: "new",
    title: input.title.trim(),
    details: input.details.trim(),
    budget: input.budget?.trim() ?? "",
    travelDate: input.travelDate?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  }

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("service_requests").insert({
      id: request.id,
      user_id: request.userId,
      service_type: request.serviceType,
      status: request.status,
      title: request.title,
      details: request.details,
      budget: request.budget,
      travel_date: request.travelDate,
      created_at: request.createdAt,
      updated_at: request.updatedAt,
    })

    if (error) throw error
    return request
  }

  const db = await getDb()
  await db.query(
    `INSERT INTO service_requests (id, user_id, service_type, status, title, details, budget, travel_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      request.id,
      request.userId,
      request.serviceType,
      request.status,
      request.title,
      request.details,
      request.budget,
      request.travelDate,
      request.createdAt,
      request.updatedAt,
    ]
  )

  return request
}
