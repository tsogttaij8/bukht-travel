import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import {
  mapServiceRequest,
  mapUserProfile,
  profileSelect,
  requestSelect,
  type CustomerType,
  type ServiceRequestRow,
  type ServiceType,
  type StoredServiceRequest,
  type StoredUserProfile,
  type UserProfileRow,
} from "./customer-model"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"
import { findUserByEmail, type StoredUser } from "./user-store"

export type { CustomerType, ServiceType, ServiceRequestStatus, StoredServiceRequest, StoredUserProfile } from "./customer-model"

export async function ensureUserProfile(user: StoredUser): Promise<StoredUserProfile> {
  const now = new Date().toISOString()
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("user_profiles").insert(toEmptyProfileRow(user, now)).select(profileSelect).single()
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
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email
     RETURNING ${profileSelect}`,
    [user.id, user.email, "", "", "", JSON.stringify([]), "", now, now]
  )
  return mapUserProfile(result.rows[0])
}

export async function findUserProfileByEmail(email: string): Promise<StoredUserProfile | null> {
  const normalizedEmail = email.trim().toLowerCase()
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("user_profiles").select(profileSelect).eq("email", normalizedEmail).maybeSingle()
    if (error) throw error
    return data ? mapUserProfile(data as UserProfileRow) : null
  }
  const db = await getDb()
  const result = await db.query<UserProfileRow>(`SELECT ${profileSelect} FROM user_profiles WHERE email = $1 LIMIT 1`, [normalizedEmail])
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
  const nextProfile = { ...existing, phone: input.phone?.trim() ?? existing.phone, companyName: input.companyName?.trim() ?? existing.companyName, telegramHandle: input.telegramHandle?.trim() ?? existing.telegramHandle, customerTypes: input.customerTypes ?? existing.customerTypes, notes: input.notes?.trim() ?? existing.notes, updatedAt: new Date().toISOString() }

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("user_profiles").update(toProfileUpdate(nextProfile)).eq("email", user.email)
    if (error) throw error
    return nextProfile
  }

  const db = await getDb()
  await db.query(
    `UPDATE user_profiles SET phone = $1, company_name = $2, telegram_handle = $3, customer_types = $4, notes = $5, updated_at = $6 WHERE email = $7`,
    [nextProfile.phone, nextProfile.companyName, nextProfile.telegramHandle, JSON.stringify(nextProfile.customerTypes), nextProfile.notes, nextProfile.updatedAt, user.email]
  )
  return nextProfile
}

export async function listServiceRequestsByEmail(email: string): Promise<StoredServiceRequest[]> {
  const user = await findUserByEmail(email)
  if (!user) return []
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("service_requests").select(requestSelect).eq("user_id", user.id).order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map((item) => mapServiceRequest(item as ServiceRequestRow))
  }
  const db = await getDb()
  const result = await db.query<ServiceRequestRow>(`SELECT ${requestSelect} FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC`, [user.id])
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
  const request = buildServiceRequest(user.id, input)

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("service_requests").insert(toServiceRequestRow(request))
    if (error) throw error
    return request
  }

  const db = await getDb()
  await db.query(`INSERT INTO service_requests (${requestSelect.replaceAll(", ", ", ")}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, Object.values(toServiceRequestRow(request)))
  return request
}

function toEmptyProfileRow(user: StoredUser, now: string) {
  return { user_id: user.id, email: user.email, phone: "", company_name: "", telegram_handle: "", customer_types: [], notes: "", created_at: now, updated_at: now }
}

function toProfileUpdate(profile: StoredUserProfile) {
  return { phone: profile.phone, company_name: profile.companyName, telegram_handle: profile.telegramHandle, customer_types: profile.customerTypes, notes: profile.notes, updated_at: profile.updatedAt }
}

function buildServiceRequest(userId: string, input: Parameters<typeof createServiceRequest>[0]): StoredServiceRequest {
  const now = new Date().toISOString()
  return { id: randomUUID(), userId, serviceType: input.serviceType, status: "new", title: input.title.trim(), details: input.details.trim(), budget: input.budget?.trim() ?? "", travelDate: input.travelDate?.trim() ?? "", createdAt: now, updatedAt: now }
}

function toServiceRequestRow(request: StoredServiceRequest) {
  return { id: request.id, user_id: request.userId, service_type: request.serviceType, status: request.status, title: request.title, details: request.details, budget: request.budget, travel_date: request.travelDate, created_at: request.createdAt, updated_at: request.updatedAt }
}

