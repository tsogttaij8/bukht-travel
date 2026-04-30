export type UserRole = "owner" | "cargo_staff" | "travel_staff" | "esim_staff" | "finance_staff" | "support_staff" | "customer"
export type LegacyUserRole = "user" | "developer"
export type LoginFlowMode = "register" | "login"

export type SessionUser = {
  name: string
  email: string
  role: LegacyUserRole
  roles: UserRole[]
}

export type UserProfile = {
  userId: string
  email: string
  phone: string
  companyName: string
  telegramHandle: string
  customerTypes: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type ServiceRequest = {
  id: string
  userId: string
  serviceType: "travel" | "cargo" | "esim" | "product_sourcing"
  status: "new" | "contacted" | "quoted" | "confirmed" | "completed" | "cancelled"
  title: string
  details: string
  budget: string
  travelDate: string
  createdAt: string
  updatedAt: string
}

export type ShipmentStatus = "registered" | "received" | "in_transit" | "arrived" | "delivered"

export type ShipmentEvent = {
  id: string
  shipmentId: string
  status: ShipmentStatus
  details: string
  location: string
  happenedAt: string
  createdAt: string
}

export type ShipmentTracking = {
  shipment: {
    id: string
    trackingCode: string
    customerName: string
    customerEmail: string
    origin: string
    destination: string
    currentStatus: ShipmentStatus
    notes: string
    createdAt: string
    updatedAt: string
  }
  events: ShipmentEvent[]
}

type ApiResult = { ok: true } | { ok: false; message: string }

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string }
    return body.message ?? fallback
  } catch {
    return fallback
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/me", { method: "GET", cache: "no-store" })

  if (!response.ok) return null

  try {
    const body = (await response.json()) as { user?: SessionUser | null }
    return body.user ?? null
  } catch {
    return null
  }
}

export async function getCurrentSession(): Promise<{ user: SessionUser | null; profile?: UserProfile | null }> {
  const response = await fetch("/api/auth/me", { method: "GET", cache: "no-store" })

  if (!response.ok) return { user: null, profile: null }

  try {
    const body = (await response.json()) as { user?: SessionUser | null; profile?: UserProfile | null }
    return { user: body.user ?? null, profile: body.profile ?? null }
  } catch {
    return { user: null, profile: null }
  }
}

export async function sendLoginCode(
  email: string,
  name?: string,
  mode: LoginFlowMode = "login"
): Promise<
  | { ok: true; devCode?: string; message?: string; deliveryMode?: "email" | "dev"; deliveryProvider?: string }
  | { ok: false; message: string }
> {
  const response = await fetch("/api/auth/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, mode }),
  })

  if (!response.ok) {
    return { ok: false, message: await parseError(response, "Код илгээхэд алдаа гарлаа") }
  }

  try {
    const body = (await response.json()) as {
      devCode?: string
      message?: string
      deliveryMode?: "email" | "dev"
      deliveryProvider?: string
    }
    return {
      ok: true,
      devCode: body.devCode,
      message: body.message,
      deliveryMode: body.deliveryMode,
      deliveryProvider: body.deliveryProvider,
    }
  } catch {
    return { ok: true }
  }
}

export async function verifyLoginCode(email: string, code: string): Promise<(ApiResult & { user?: SessionUser })> {
  const response = await fetch("/api/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  })

  if (!response.ok) {
    return { ok: false, message: await parseError(response, "Нэвтрэхэд алдаа гарлаа") }
  }

  try {
    const body = (await response.json()) as { user?: SessionUser }
    return { ok: true, user: body.user }
  } catch {
    return { ok: true }
  }
}

export async function syncClerkSession(): Promise<(ApiResult & { user?: SessionUser })> {
  const response = await fetch("/api/auth/clerk-sync", { method: "POST", cache: "no-store" })

  if (!response.ok) {
    return { ok: false, message: await parseError(response, "Clerk session holbohod aldaa garlaa") }
  }

  try {
    const body = (await response.json()) as { user?: SessionUser }
    return { ok: true, user: body.user }
  } catch {
    return { ok: true }
  }
}

export async function logoutUser(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
}
