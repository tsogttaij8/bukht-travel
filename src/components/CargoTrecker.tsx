"use client"

import { useState } from "react"
import type { ShipmentEvent, StoredShipment } from "../lib/server/shipment-store"

function labelForStatus(status: ShipmentEvent["status"] | StoredShipment["currentStatus"]): string {
  switch (status) {
    case "registered":
      return "Бүртгэсэн"
    case "received":
      return "Агуулахад авсан"
    case "in_transit":
      return "Замд явж байна"
    case "arrived":
      return "Ирсэн"
    case "delivered":
      return "Хүргэгдсэн"
  }
}

export default function CargoTracker() {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState("")
  const [shipment, setShipment] = useState<StoredShipment | null>(null)
  const [events, setEvents] = useState<ShipmentEvent[]>([])
  const [loading, setLoading] = useState(false)

  async function track() {
    const trimmedCode = code.trim()

    if (!trimmedCode) {
      setStatus("Tracking кодоо оруулна уу")
      setShipment(null)
      setEvents([])
      return
    }

    setLoading(true)
    setStatus("")
    setShipment(null)
    setEvents([])

    const response = await fetch(`/api/shipments/${encodeURIComponent(trimmedCode)}`, {
      method: "GET",
      cache: "no-store",
    })

    const body = (await response.json()) as {
      shipment?: StoredShipment
      events?: ShipmentEvent[]
      message?: string
    }

    setLoading(false)

    if (!response.ok || !body.shipment) {
      setStatus(body.message ?? "Tracking олдсонгүй")
      return
    }

    setShipment(body.shipment)
    setEvents(body.events ?? [])
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h3 style={{ marginTop: 0 }}>Карго Tracking</h3>
      <p style={{ margin: "0 0 14px" }}>Жишээ код: <strong>1234</strong></p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          style={{ flex: "1 1 230px", padding: "12px 14px", borderRadius: 10, border: "1px solid #d7cfbf", fontSize: 15 }}
          placeholder="Tracking код"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />

        <button className="btn btn-primary" style={{ flex: "0 0 auto" }} onClick={track} disabled={loading}>
          {loading ? "Шалгаж байна..." : "Шалгах"}
        </button>
      </div>

      {shipment ? (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div style={{ padding: 14, border: "1px solid #e4d8c6", borderRadius: 12, background: "#fcfaf6" }}>
            <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{shipment.customerName}</p>
            <p style={{ margin: "0 0 6px" }}>{shipment.origin} -&gt; {shipment.destination}</p>
            <p style={{ margin: 0, color: "#8a5a3c", fontWeight: 700 }}>Одоогийн төлөв: {labelForStatus(shipment.currentStatus)}</p>
          </div>

          {events.map((event) => (
            <div key={event.id} style={{ borderLeft: "3px solid #d8b98a", paddingLeft: 12 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{labelForStatus(event.status)}</p>
              <p style={{ margin: "0 0 4px" }}>{event.details}</p>
              <p style={{ margin: 0, color: "#6b5b4c", fontSize: "0.92rem" }}>
                {event.location} • {new Date(event.happenedAt).toLocaleString("mn-MN")}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {status ? <p style={{ marginBottom: 0, marginTop: 14, fontWeight: 600 }}>{status}</p> : null}
    </div>
  )
}
