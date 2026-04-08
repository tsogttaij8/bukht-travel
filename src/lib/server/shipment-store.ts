import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

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

type ShipmentRow = {
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

type ShipmentEventRow = {
  id: string
  shipment_id: string
  status: ShipmentStatus
  details: string
  location: string
  happened_at: string
  created_at: string
}

function mapShipment(row: ShipmentRow): StoredShipment {
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

function mapShipmentEvent(row: ShipmentEventRow): ShipmentEvent {
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

export type ShipmentTracking = {
  shipment: StoredShipment
  events: ShipmentEvent[]
}

export async function listShipments(): Promise<StoredShipment[]> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("shipments")
      .select("id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at")
      .order("updated_at", { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapShipment)
  }

  const db = await getDb()
  const result = await db.query<ShipmentRow>(
    `SELECT id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at
     FROM shipments
     ORDER BY updated_at DESC`
  )

  return result.rows.map(mapShipment)
}

export async function listShipmentsByCustomerEmail(email: string): Promise<StoredShipment[]> {
  const normalizedEmail = email.trim().toLowerCase()

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("shipments")
      .select("id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at")
      .eq("customer_email", normalizedEmail)
      .order("updated_at", { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapShipment)
  }

  const db = await getDb()
  const result = await db.query<ShipmentRow>(
    `SELECT id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at
     FROM shipments
     WHERE customer_email = $1
     ORDER BY updated_at DESC`,
    [normalizedEmail]
  )

  return result.rows.map(mapShipment)
}

export async function findShipmentByTrackingCode(trackingCode: string): Promise<StoredShipment | null> {
  const normalized = trackingCode.trim()

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("shipments")
      .select("id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at")
      .eq("tracking_code", normalized)
      .maybeSingle()

    if (error) throw error
    return data ? mapShipment(data) : null
  }

  const db = await getDb()
  const result = await db.query<ShipmentRow>(
    `SELECT id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at
     FROM shipments
     WHERE tracking_code = $1
     LIMIT 1`,
    [normalized]
  )

  const row = result.rows[0]
  return row ? mapShipment(row) : null
}

export async function listShipmentEvents(shipmentId: string): Promise<ShipmentEvent[]> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("shipment_events")
      .select("id, shipment_id, status, details, location, happened_at, created_at")
      .eq("shipment_id", shipmentId)
      .order("happened_at", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapShipmentEvent)
  }

  const db = await getDb()
  const result = await db.query<ShipmentEventRow>(
    `SELECT id, shipment_id, status, details, location, happened_at, created_at
     FROM shipment_events
     WHERE shipment_id = $1
     ORDER BY happened_at DESC, created_at DESC`,
    [shipmentId]
  )

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

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error: shipmentError } = await supabase.from("shipments").insert({
      id: shipmentId,
      tracking_code: input.trackingCode.trim(),
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail.trim().toLowerCase(),
      origin: input.origin.trim(),
      destination: input.destination.trim(),
      current_status: input.currentStatus,
      notes: input.notes?.trim() ?? "",
      created_at: now,
      updated_at: now,
    })

    if (shipmentError) throw shipmentError

    const { error: eventError } = await supabase.from("shipment_events").insert({
      id: randomUUID(),
      shipment_id: shipmentId,
      status: input.currentStatus,
      details: input.initialDetails?.trim() || "Shipment created by admin.",
      location: input.initialLocation?.trim() || input.origin.trim(),
      happened_at: now,
      created_at: now,
    })

    if (eventError) throw eventError

    const created = await findShipmentByTrackingCode(input.trackingCode)
    if (!created) throw new Error("Failed to create shipment")
    return created
  }

  const db = await getDb()

  await db.query(
    `INSERT INTO shipments (
      id, tracking_code, customer_name, customer_email, origin, destination, current_status, notes, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      shipmentId,
      input.trackingCode.trim(),
      input.customerName.trim(),
      input.customerEmail.trim().toLowerCase(),
      input.origin.trim(),
      input.destination.trim(),
      input.currentStatus,
      input.notes?.trim() ?? "",
      now,
      now,
    ]
  )

  await db.query(
    `INSERT INTO shipment_events (id, shipment_id, status, details, location, happened_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      randomUUID(),
      shipmentId,
      input.currentStatus,
      input.initialDetails?.trim() || "Shipment created by admin.",
      input.initialLocation?.trim() || input.origin.trim(),
      now,
      now,
    ]
  )

  const created = await findShipmentByTrackingCode(input.trackingCode)
  if (!created) {
    throw new Error("Failed to create shipment")
  }

  return created
}

export async function appendShipmentEvent(input: {
  trackingCode: string
  status: ShipmentStatus
  details: string
  location: string
}): Promise<{ shipment: StoredShipment; events: ShipmentEvent[] }> {
  const shipment = await findShipmentByTrackingCode(input.trackingCode)

  if (!shipment) {
    throw new Error("Shipment not found")
  }

  const now = new Date().toISOString()

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error: eventError } = await supabase.from("shipment_events").insert({
      id: randomUUID(),
      shipment_id: shipment.id,
      status: input.status,
      details: input.details.trim(),
      location: input.location.trim(),
      happened_at: now,
      created_at: now,
    })

    if (eventError) throw eventError

    const { error: shipmentError } = await supabase
      .from("shipments")
      .update({ current_status: input.status, updated_at: now })
      .eq("id", shipment.id)

    if (shipmentError) throw shipmentError

    const updatedShipment = await findShipmentByTrackingCode(input.trackingCode)
    if (!updatedShipment) throw new Error("Shipment not found after update")

    return {
      shipment: updatedShipment,
      events: await listShipmentEvents(updatedShipment.id),
    }
  }

  const db = await getDb()

  await db.query(
    `INSERT INTO shipment_events (id, shipment_id, status, details, location, happened_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      randomUUID(),
      shipment.id,
      input.status,
      input.details.trim(),
      input.location.trim(),
      now,
      now,
    ]
  )

  await db.query(
    `UPDATE shipments
     SET current_status = $1, updated_at = $2
     WHERE id = $3`,
    [input.status, now, shipment.id]
  )

  const updatedShipment = await findShipmentByTrackingCode(input.trackingCode)
  if (!updatedShipment) {
    throw new Error("Shipment not found after update")
  }

  return {
    shipment: updatedShipment,
    events: await listShipmentEvents(updatedShipment.id),
  }
}

export async function getShipmentTracking(trackingCode: string): Promise<{ shipment: StoredShipment; events: ShipmentEvent[] } | null> {
  const shipment = await findShipmentByTrackingCode(trackingCode)

  if (!shipment) return null

  return {
    shipment,
    events: await listShipmentEvents(shipment.id),
  }
}

export async function listShipmentsWithEvents(): Promise<ShipmentTracking[]> {
  const shipments = await listShipments()

  return Promise.all(
    shipments.map(async (shipment) => ({
      shipment,
      events: await listShipmentEvents(shipment.id),
    }))
  )
}

export async function listShipmentsWithEventsByCustomerEmail(email: string): Promise<ShipmentTracking[]> {
  const shipments = await listShipmentsByCustomerEmail(email)

  return Promise.all(
    shipments.map(async (shipment) => ({
      shipment,
      events: await listShipmentEvents(shipment.id),
    }))
  )
}
