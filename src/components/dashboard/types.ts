import type { StoredProduct } from "../../lib/server/product-store"
import type { ShipmentEvent, ShipmentStatus, StoredShipment } from "../../lib/server/shipment-store"
import type { StoredUser, UserRole } from "../../lib/server/user-store"

export type DashboardShipment = StoredShipment & {
  events: ShipmentEvent[]
  eventsLoaded: boolean
}

export type StaffAccessDraft = {
  name: string
  roles: UserRole[]
  status: "active" | "disabled"
  busy: boolean
  error: string
}

export type ProductForm = {
  name: string
  category: string
  price: string
  moq: string
  origin: string
  leadTime: string
  badge: string
  summary: string
}

export type ShipmentForm = {
  trackingCode: string
  customerName: string
  customerEmail: string
  origin: string
  destination: string
  currentStatus: ShipmentStatus
  notes: string
}

export type ShipmentUpdateState = Record<
  string,
  { status: ShipmentStatus; details: string; location: string; busy: boolean; error: string }
>

export type DashboardData = {
  users: StoredUser[]
  products: StoredProduct[]
  shipments: DashboardShipment[]
}

