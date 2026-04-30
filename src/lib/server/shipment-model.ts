export type ShipmentStatus = "registered" | "received" | "in_transit" | "arrived" | "delivered"

export type StoredShipment = {
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

export type ShipmentEvent = {
  id: string
  shipmentId: string
  status: ShipmentStatus
  details: string
  location: string
  happenedAt: string
  createdAt: string
}

export type ShipmentRow = {
  id: string
  tracking_code: string
  customer_name: string
  customer_email: string
  origin: string
  destination: string
  current_status: ShipmentStatus
  notes: string
  created_at: string
  updated_at: string
}

export type ShipmentEventRow = {
  id: string
  shipment_id: string
  status: ShipmentStatus
  details: string
  location: string
  happened_at: string
  created_at: string
}

export type ShipmentTracking = {
  shipment: StoredShipment
  events: ShipmentEvent[]
}

export function mapShipment(row: ShipmentRow): StoredShipment {
  return {
    id: row.id,
    trackingCode: row.tracking_code,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    origin: row.origin,
    destination: row.destination,
    currentStatus: row.current_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapShipmentEvent(row: ShipmentEventRow): ShipmentEvent {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    status: row.status,
    details: row.details,
    location: row.location,
    happenedAt: row.happened_at,
    createdAt: row.created_at,
  }
}

export const shipmentSelect =
  "id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at"

export const shipmentEventSelect = "id, shipment_id, status, details, location, happened_at, created_at"

