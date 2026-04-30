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

export type UserProfileRow = {
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

export type ServiceRequestRow = {
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

export const profileSelect = "user_id, email, phone, company_name, telegram_handle, customer_types, notes, created_at, updated_at"
export const requestSelect = "id, user_id, service_type, status, title, details, budget, travel_date, created_at, updated_at"

export function mapUserProfile(row: UserProfileRow): StoredUserProfile {
  return { userId: row.user_id, email: row.email, phone: row.phone, companyName: row.company_name, telegramHandle: row.telegram_handle, customerTypes: normalizeCustomerTypes(row.customer_types), notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }
}

export function mapServiceRequest(row: ServiceRequestRow): StoredServiceRequest {
  return { id: row.id, userId: row.user_id, serviceType: row.service_type, status: row.status, title: row.title, details: row.details, budget: row.budget, travelDate: row.travel_date, createdAt: row.created_at, updatedAt: row.updated_at }
}

export function normalizeCustomerTypes(input: unknown): CustomerType[] {
  const validTypes: CustomerType[] = ["traveler", "merchant", "cargo_customer", "esim_customer"]
  if (Array.isArray(input)) return input.filter((item): item is CustomerType => validTypes.includes(item as CustomerType))
  if (typeof input !== "string") return []
  try {
    return normalizeCustomerTypes(JSON.parse(input) as unknown)
  } catch {
    return []
  }
}

