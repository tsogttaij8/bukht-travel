"use client"

import { useState } from "react"
import type { ShipmentEvent, ShipmentStatus, StoredShipment } from "../../lib/server/shipment-store"
import type { DashboardShipment, ShipmentForm, ShipmentUpdateState } from "./types"

const emptyShipmentForm: ShipmentForm = {
  trackingCode: "",
  customerName: "",
  customerEmail: "",
  origin: "Beijing Warehouse",
  destination: "Ulaanbaatar",
  currentStatus: "registered",
  notes: "",
}

export function useShipments(setShipments: (updater: (shipments: DashboardShipment[]) => DashboardShipment[]) => void) {
  const [form, setForm] = useState<ShipmentForm>(emptyShipmentForm)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [updateState, setUpdateState] = useState<ShipmentUpdateState>({})

  async function createShipment(): Promise<void> {
    setBusy(true)
    setError("")
    const response = await fetch("/api/admin/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const body = (await response.json()) as { shipment?: StoredShipment; events?: ShipmentEvent[]; message?: string }
    setBusy(false)
    if (!response.ok || !body.shipment || !body.events) return setError(body.message ?? "Shipment үүсгэхэд алдаа гарлаа")
    setShipments((current) => [{ ...body.shipment!, events: body.events!, eventsLoaded: true }, ...current])
    setForm(emptyShipmentForm)
  }

  async function loadShipmentEvents(target: DashboardShipment): Promise<void> {
    if (target.eventsLoaded) return
    setUpdateState((state) => ({ ...state, [target.trackingCode]: draftFor(target, state[target.trackingCode], true) }))
    const response = await fetch(`/api/admin/shipments?trackingCode=${encodeURIComponent(target.trackingCode)}`, { cache: "no-store" })
    const body = (await response.json()) as { shipment?: StoredShipment; events?: ShipmentEvent[]; message?: string }
    if (!response.ok || !body.shipment || !body.events) {
      setUpdateState((state) => ({ ...state, [target.trackingCode]: { ...draftFor(target, state[target.trackingCode]), busy: false, error: body.message ?? "Түүх ачаалахад алдаа гарлаа" } }))
      return
    }
    setShipments((current) => current.map((shipment) => shipment.trackingCode === target.trackingCode ? { ...shipment, events: body.events ?? [], eventsLoaded: true } : shipment))
    setUpdateState((state) => ({ ...state, [target.trackingCode]: { ...draftFor(target, state[target.trackingCode]), status: body.shipment!.currentStatus, busy: false, error: "" } }))
  }

  async function addEvent(shipment: DashboardShipment): Promise<void> {
    const current = updateState[shipment.trackingCode]
    if (!current) return
    setUpdateState((state) => ({ ...state, [shipment.trackingCode]: { ...current, busy: true, error: "" } }))
    const response = await fetch("/api/admin/shipments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingCode: shipment.trackingCode, status: current.status, details: current.details, location: current.location }),
    })
    const body = (await response.json()) as { shipment?: StoredShipment; events?: ShipmentEvent[]; message?: string }
    if (!response.ok || !body.shipment || !body.events) {
      setUpdateState((state) => ({ ...state, [shipment.trackingCode]: { ...current, busy: false, error: body.message ?? "Төлөв шинэчлэхэд алдаа гарлаа" } }))
      return
    }
    setShipments((items) => items.map((item) => item.trackingCode === shipment.trackingCode ? { ...body.shipment!, events: body.events!, eventsLoaded: true } : item))
    setUpdateState((state) => ({ ...state, [shipment.trackingCode]: { status: body.shipment!.currentStatus, details: "", location: "", busy: false, error: "" } }))
  }

  return { form, setForm, error, busy, updateState, setUpdateState, createShipment, loadShipmentEvents, addEvent }
}

function draftFor(shipment: DashboardShipment, current?: ShipmentUpdateState[string], busy = false) {
  return { status: current?.status ?? shipment.currentStatus as ShipmentStatus, details: current?.details ?? "", location: current?.location ?? "", busy, error: "" }
}

