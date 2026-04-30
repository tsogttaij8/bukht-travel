import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import {
  mapShipment,
  mapShipmentEvent,
  shipmentEventSelect,
  shipmentSelect,
  type ShipmentEvent,
  type ShipmentEventRow,
  type ShipmentRow,
  type ShipmentStatus,
  type ShipmentTracking,
  type StoredShipment,
} from "./shipment-model"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { ShipmentEvent, ShipmentStatus, ShipmentTracking, StoredShipment } from "./shipment-model"

export async function listShipments(): Promise<StoredShipment[]> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("shipments").select(shipmentSelect).order("updated_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapShipment)
  }
  const db = await getDb()
  const result = await db.query<ShipmentRow>(`SELECT ${shipmentSelect} FROM shipments ORDER BY updated_at DESC`)
  return result.rows.map(mapShipment)
}

export async function listShipmentsByCustomerEmail(email: string): Promise<StoredShipment[]> {
  const normalizedEmail = email.trim().toLowerCase()
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("shipments").select(shipmentSelect).eq("customer_email", normalizedEmail).order("updated_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapShipment)
  }
  const db = await getDb()
  const result = await db.query<ShipmentRow>(`SELECT ${shipmentSelect} FROM shipments WHERE customer_email = $1 ORDER BY updated_at DESC`, [normalizedEmail])
  return result.rows.map(mapShipment)
}

export async function findShipmentByTrackingCode(trackingCode: string): Promise<StoredShipment | null> {
  const normalized = trackingCode.trim()
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("shipments").select(shipmentSelect).eq("tracking_code", normalized).maybeSingle()
    if (error) throw error
    return data ? mapShipment(data) : null
  }
  const db = await getDb()
  const result = await db.query<ShipmentRow>(`SELECT ${shipmentSelect} FROM shipments WHERE tracking_code = $1 LIMIT 1`, [normalized])
  return result.rows[0] ? mapShipment(result.rows[0]) : null
}

export async function listShipmentEvents(shipmentId: string): Promise<ShipmentEvent[]> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("shipment_events").select(shipmentEventSelect).eq("shipment_id", shipmentId).order("happened_at", { ascending: false }).order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapShipmentEvent)
  }
  const db = await getDb()
  const result = await db.query<ShipmentEventRow>(`SELECT ${shipmentEventSelect} FROM shipment_events WHERE shipment_id = $1 ORDER BY happened_at DESC, created_at DESC`, [shipmentId])
  return result.rows.map(mapShipmentEvent)
}

export async function createShipment(input: {
  trackingCode: string
  customerName: string
  customerEmail: string
  origin: string
  destination: string
  currentStatus: ShipmentStatus
  notes?: string
  initialDetails?: string
  initialLocation?: string
}): Promise<StoredShipment> {
  const shipmentId = randomUUID()
  const now = new Date().toISOString()
  const shipmentRow = toShipmentInsert(input, shipmentId, now)
  const eventRow = toShipmentEventInsert(shipmentId, input.currentStatus, input.initialDetails?.trim() || "Shipment created by admin.", input.initialLocation?.trim() || input.origin.trim(), now)

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error: shipmentError } = await supabase.from("shipments").insert(shipmentRow)
    if (shipmentError) throw shipmentError
    const { error: eventError } = await supabase.from("shipment_events").insert(eventRow)
    if (eventError) throw eventError
  } else {
    const db = await getDb()
    await db.query(`INSERT INTO shipments (id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, Object.values(shipmentRow))
    await db.query(`INSERT INTO shipment_events (id, shipment_id, status, details, location, happened_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, Object.values(eventRow))
  }

  const created = await findShipmentByTrackingCode(input.trackingCode)
  if (!created) throw new Error("Failed to create shipment")
  return created
}

export async function appendShipmentEvent(input: {
  trackingCode: string
  status: ShipmentStatus
  details: string
  location: string
}): Promise<{ shipment: StoredShipment; events: ShipmentEvent[] }> {
  const shipment = await findShipmentByTrackingCode(input.trackingCode)
  if (!shipment) throw new Error("Shipment not found")
  const now = new Date().toISOString()
  const eventRow = toShipmentEventInsert(shipment.id, input.status, input.details.trim(), input.location.trim(), now)

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error: eventError } = await supabase.from("shipment_events").insert(eventRow)
    if (eventError) throw eventError
    const { error: shipmentError } = await supabase.from("shipments").update({ current_status: input.status, updated_at: now }).eq("id", shipment.id)
    if (shipmentError) throw shipmentError
  } else {
    const db = await getDb()
    await db.query(`INSERT INTO shipment_events (id, shipment_id, status, details, location, happened_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, Object.values(eventRow))
    await db.query("UPDATE shipments SET current_status = $1, updated_at = $2 WHERE id = $3", [input.status, now, shipment.id])
  }

  const updated = await findShipmentByTrackingCode(input.trackingCode)
  if (!updated) throw new Error("Shipment not found after update")
  return { shipment: updated, events: await listShipmentEvents(updated.id) }
}

export async function getShipmentTracking(trackingCode: string): Promise<ShipmentTracking | null> {
  const shipment = await findShipmentByTrackingCode(trackingCode)
  return shipment ? { shipment, events: await listShipmentEvents(shipment.id) } : null
}

export async function listShipmentsWithEvents(): Promise<ShipmentTracking[]> {
  return Promise.all((await listShipments()).map(withEvents))
}

export async function listShipmentsWithEventsByCustomerEmail(email: string): Promise<ShipmentTracking[]> {
  return Promise.all((await listShipmentsByCustomerEmail(email)).map(withEvents))
}

function withEvents(shipment: StoredShipment): Promise<ShipmentTracking> {
  return listShipmentEvents(shipment.id).then((events) => ({ shipment, events }))
}

function toShipmentInsert(input: Parameters<typeof createShipment>[0], shipmentId: string, now: string) {
  return { id: shipmentId, tracking_code: input.trackingCode.trim(), customer_name: input.customerName.trim(), customer_email: input.customerEmail.trim().toLowerCase(), origin: input.origin.trim(), destination: input.destination.trim(), current_status: input.currentStatus, notes: input.notes?.trim() ?? "", created_at: now, updated_at: now }
}

function toShipmentEventInsert(shipmentId: string, status: ShipmentStatus, details: string, location: string, now: string) {
  return { id: randomUUID(), shipment_id: shipmentId, status, details, location, happened_at: now, created_at: now }
}

