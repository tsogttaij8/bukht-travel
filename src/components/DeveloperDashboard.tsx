"use client"

import { useEffect, useMemo, useState } from "react"
import type { StoredProduct } from "../lib/server/product-store"
import type { ShipmentEvent, ShipmentStatus, StoredShipment } from "../lib/server/shipment-store"
import type { StoredUser } from "../lib/server/user-store"

type DashboardShipment = StoredShipment & {
  events: ShipmentEvent[]
  eventsLoaded: boolean
}

const shipmentStatuses: ShipmentStatus[] = ["registered", "received", "in_transit", "arrived", "delivered"]

function labelForStatus(status: ShipmentStatus): string {
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

export default function DeveloperDashboard() {
  const [users, setUsers] = useState<StoredUser[]>([])
  const [shipments, setShipments] = useState<DashboardShipment[]>([])
  const [products, setProducts] = useState<StoredProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [createForm, setCreateForm] = useState({
    trackingCode: "",
    customerName: "",
    customerEmail: "",
    origin: "Beijing Warehouse",
    destination: "Ulaanbaatar",
    currentStatus: "registered" as ShipmentStatus,
    notes: "",
  })
  const [createError, setCreateError] = useState("")
  const [createBusy, setCreateBusy] = useState(false)
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    moq: "",
    origin: "Guangzhou",
    leadTime: "7-10 хоног",
    badge: "New",
    summary: "",
  })
  const [productError, setProductError] = useState("")
  const [productBusy, setProductBusy] = useState(false)
  const [updateState, setUpdateState] = useState<Record<string, { status: ShipmentStatus; details: string; location: string; busy: boolean; error: string }>>({})

  const totalDevelopers = useMemo(() => users.filter((user) => user.role === "developer").length, [users])

  useEffect(() => {
    let active = true

    async function loadDashboard(): Promise<void> {
      setLoading(true)
      setLoadError("")

      try {
        const [usersResult, productsResult, shipmentsResult] = await Promise.allSettled([
          fetch("/api/admin/users", { cache: "no-store" }),
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/shipments", { cache: "no-store" }),
        ])

        if (!active) return

        const errors: string[] = []

        if (usersResult.status === "fulfilled") {
          const body = (await usersResult.value.json()) as { users?: StoredUser[]; message?: string }
          if (usersResult.value.ok) {
            setUsers(body.users ?? [])
          } else {
            errors.push(body.message ?? "Хэрэглэгчдийн мэдээлэл ачаалахад алдаа гарлаа.")
          }
        } else {
          errors.push("Хэрэглэгчдийн мэдээлэл ачаалахад алдаа гарлаа.")
        }

        if (productsResult.status === "fulfilled") {
          const body = (await productsResult.value.json()) as { products?: StoredProduct[]; message?: string }
          if (productsResult.value.ok) {
            setProducts(body.products ?? [])
          } else {
            errors.push(body.message ?? "Барааны мэдээлэл ачаалахад алдаа гарлаа.")
          }
        } else {
          errors.push("Барааны мэдээлэл ачаалахад алдаа гарлаа.")
        }

        if (shipmentsResult.status === "fulfilled") {
          const body = (await shipmentsResult.value.json()) as { shipments?: StoredShipment[]; message?: string }
          if (shipmentsResult.value.ok) {
            setShipments(
              (body.shipments ?? []).map((shipment) => ({
                ...shipment,
                events: [],
                eventsLoaded: false,
              }))
            )
          } else {
            errors.push(body.message ?? "Shipment мэдээлэл ачаалахад алдаа гарлаа.")
          }
        } else {
          errors.push("Shipment мэдээлэл ачаалахад алдаа гарлаа.")
        }

        if (errors.length > 0) {
          setLoadError(errors[0] ?? "Dashboard мэдээлэл ачаалахад алдаа гарлаа.")
        }
      } catch (error) {
        if (!active) return
        setLoadError(error instanceof Error ? error.message : "Dashboard мэдээлэл ачаалахад алдаа гарлаа.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  async function loadShipmentEvents(trackingCode: string): Promise<void> {
    const target = shipments.find((shipment) => shipment.trackingCode === trackingCode)
    if (!target || target.eventsLoaded) return

    setUpdateState((state) => ({
      ...state,
      [trackingCode]: {
        status: state[trackingCode]?.status ?? target.currentStatus,
        details: state[trackingCode]?.details ?? "",
        location: state[trackingCode]?.location ?? "",
        busy: true,
        error: "",
      },
    }))

    const response = await fetch(`/api/admin/shipments?trackingCode=${encodeURIComponent(trackingCode)}`, {
      cache: "no-store",
    })

    const body = (await response.json()) as {
      shipment?: StoredShipment
      events?: ShipmentEvent[]
      message?: string
    }

    if (!response.ok || !body.shipment || !body.events) {
      setUpdateState((state) => ({
        ...state,
        [trackingCode]: {
          status: state[trackingCode]?.status ?? target.currentStatus,
          details: state[trackingCode]?.details ?? "",
          location: state[trackingCode]?.location ?? "",
          busy: false,
          error: body.message ?? "Shipment түүх ачаалахад алдаа гарлаа",
        },
      }))
      return
    }

    setShipments((current) =>
      current.map((shipment) =>
        shipment.trackingCode === trackingCode
          ? { ...shipment, events: body.events ?? [], eventsLoaded: true }
          : shipment
      )
    )

    setUpdateState((state) => ({
      ...state,
      [trackingCode]: {
        status: body.shipment?.currentStatus ?? target.currentStatus,
        details: state[trackingCode]?.details ?? "",
        location: state[trackingCode]?.location ?? "",
        busy: false,
        error: "",
      },
    }))
  }

  async function createShipment(): Promise<void> {
    setCreateBusy(true)
    setCreateError("")

    const response = await fetch("/api/admin/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    })

    const body = (await response.json()) as {
      shipment?: StoredShipment
      events?: ShipmentEvent[]
      message?: string
    }

    setCreateBusy(false)

    if (!response.ok || !body.shipment || !body.events) {
      setCreateError(body.message ?? "Shipment үүсгэхэд алдаа гарлаа")
      return
    }

    setShipments((current) => [{ ...body.shipment!, events: body.events!, eventsLoaded: true }, ...current])
    setCreateForm({
      trackingCode: "",
      customerName: "",
      customerEmail: "",
      origin: "Beijing Warehouse",
      destination: "Ulaanbaatar",
      currentStatus: "registered",
      notes: "",
    })
  }

  async function createProductEntry(): Promise<void> {
    setProductBusy(true)
    setProductError("")

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productForm),
    })

    const body = (await response.json()) as {
      product?: StoredProduct
      message?: string
    }

    setProductBusy(false)

    if (!response.ok || !body.product) {
      setProductError(body.message ?? "Бараа нэмэхэд алдаа гарлаа")
      return
    }

    setProducts((current) => [body.product!, ...current])
    setProductForm({
      name: "",
      category: "",
      price: "",
      moq: "",
      origin: "Guangzhou",
      leadTime: "7-10 хоног",
      badge: "New",
      summary: "",
    })
  }

  async function addEvent(trackingCode: string): Promise<void> {
    const current = updateState[trackingCode]
    if (!current) return

    setUpdateState((state) => ({
      ...state,
      [trackingCode]: { ...current, busy: true, error: "" },
    }))

    const response = await fetch("/api/admin/shipments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingCode,
        status: current.status,
        details: current.details,
        location: current.location,
      }),
    })

    const body = (await response.json()) as {
      shipment?: StoredShipment
      events?: ShipmentEvent[]
      message?: string
    }

    if (!response.ok || !body.shipment || !body.events) {
      setUpdateState((state) => ({
        ...state,
        [trackingCode]: { ...current, busy: false, error: body.message ?? "Төлөв шинэчлэхэд алдаа гарлаа" },
      }))
      return
    }

    setShipments((currentShipments) =>
      currentShipments.map((shipment) =>
        shipment.trackingCode === trackingCode
          ? { ...body.shipment!, events: body.events!, eventsLoaded: true }
          : shipment
      )
    )

    setUpdateState((state) => ({
      ...state,
      [trackingCode]: {
        status: body.shipment!.currentStatus,
        details: "",
        location: "",
        busy: false,
        error: "",
      },
    }))
  }

  if (loading) {
    return <section className="card"><p style={{ margin: 0 }}>Developer dashboard ачаалж байна...</p></section>
  }

  return (
    <div className="developer-dashboard" style={{ display: "grid", gap: 20 }}>
      {loadError ? (
        <section className="card">
          <p style={{ margin: 0, color: "#b42318", fontWeight: 700 }}>{loadError}</p>
        </section>
      ) : null}

      <section className="card-grid">
        <article className="card developer-stat-card" style={{ gridColumn: "span 4" }}>
          <h3>Хэрэглэгч</h3>
          <p>{users.length} бүртгэлтэй хэрэглэгч</p>
        </article>
        <article className="card developer-stat-card" style={{ gridColumn: "span 4" }}>
          <h3>Developer</h3>
          <p>{totalDevelopers} developer эрхтэй</p>
        </article>
        <article className="card developer-stat-card" style={{ gridColumn: "span 4" }}>
          <h3>Shipment</h3>
          <p>{shipments.length} ачилтын бүртгэл</p>
        </article>
        <article className="card developer-stat-card" style={{ gridColumn: "span 4" }}>
          <h3>Бараа</h3>
          <p>{products.length} нийт бүтээгдэхүүн</p>
        </article>
      </section>

      <section className="card developer-panel">
        <h3 style={{ marginBottom: 16 }}>Shop-д бараа нэмэх</h3>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input value={productForm.name} onChange={(event) => setProductForm((state) => ({ ...state, name: event.target.value }))} placeholder="Барааны нэр" className="admin-input" />
          <input value={productForm.category} onChange={(event) => setProductForm((state) => ({ ...state, category: event.target.value }))} placeholder="Ангилал" className="admin-input" />
          <input value={productForm.price} onChange={(event) => setProductForm((state) => ({ ...state, price: event.target.value }))} placeholder="Үнэ" className="admin-input" />
          <input value={productForm.moq} onChange={(event) => setProductForm((state) => ({ ...state, moq: event.target.value }))} placeholder="MOQ" className="admin-input" />
          <input value={productForm.origin} onChange={(event) => setProductForm((state) => ({ ...state, origin: event.target.value }))} placeholder="Гарал" className="admin-input" />
          <input value={productForm.leadTime} onChange={(event) => setProductForm((state) => ({ ...state, leadTime: event.target.value }))} placeholder="Хүрэх хугацаа" className="admin-input" />
          <input value={productForm.badge} onChange={(event) => setProductForm((state) => ({ ...state, badge: event.target.value }))} placeholder="Шошго" className="admin-input" />
        </div>
        <textarea value={productForm.summary} onChange={(event) => setProductForm((state) => ({ ...state, summary: event.target.value }))} placeholder="Товч тайлбар" className="admin-input" style={{ width: "100%", minHeight: 88, marginTop: 12, resize: "vertical" }} />
        {productError ? <p style={{ margin: "12px 0 0", color: "#b42318", fontWeight: 700 }}>{productError}</p> : null}
        <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={createProductEntry} disabled={productBusy}>
          {productBusy ? "Нэмж байна..." : "Бараа нэмэх"}
        </button>
      </section>

      <section className="card developer-panel">
        <h3 style={{ marginBottom: 16 }}>Шинэ shipment үүсгэх</h3>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input value={createForm.trackingCode} onChange={(event) => setCreateForm((state) => ({ ...state, trackingCode: event.target.value }))} placeholder="Tracking код" className="admin-input" />
          <input value={createForm.customerName} onChange={(event) => setCreateForm((state) => ({ ...state, customerName: event.target.value }))} placeholder="Хэрэглэгчийн нэр" className="admin-input" />
          <input value={createForm.customerEmail} onChange={(event) => setCreateForm((state) => ({ ...state, customerEmail: event.target.value }))} placeholder="Имэйл" className="admin-input" />
          <input value={createForm.origin} onChange={(event) => setCreateForm((state) => ({ ...state, origin: event.target.value }))} placeholder="Эхлэх цэг" className="admin-input" />
          <input value={createForm.destination} onChange={(event) => setCreateForm((state) => ({ ...state, destination: event.target.value }))} placeholder="Очих цэг" className="admin-input" />
          <select value={createForm.currentStatus} onChange={(event) => setCreateForm((state) => ({ ...state, currentStatus: event.target.value as ShipmentStatus }))} className="admin-input">
            {shipmentStatuses.map((status) => (
              <option key={status} value={status}>
                {labelForStatus(status)}
              </option>
            ))}
          </select>
        </div>
        <textarea value={createForm.notes} onChange={(event) => setCreateForm((state) => ({ ...state, notes: event.target.value }))} placeholder="Тэмдэглэл" className="admin-input" style={{ width: "100%", minHeight: 88, marginTop: 12, resize: "vertical" }} />
        {createError ? <p style={{ margin: "12px 0 0", color: "#b42318", fontWeight: 700 }}>{createError}</p> : null}
        <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={createShipment} disabled={createBusy}>
          {createBusy ? "Үүсгэж байна..." : "Shipment үүсгэх"}
        </button>
      </section>

      <section className="card developer-panel">
        <h3 style={{ marginBottom: 16 }}>Хэрэглэгчдийн жагсаалт</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {users.map((user) => (
            <div key={user.id} className="developer-list-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingBottom: 10, borderBottom: "1px solid #eee3d3" }}>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <span style={{ color: "#6b5b4c" }}>{user.role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card developer-panel">
        <h3 style={{ marginBottom: 16 }}>Shop барааны жагсаалт</h3>
        <div style={{ display: "grid", gap: 14 }}>
          {products.map((product) => (
            <article key={product.id} className="developer-item-card" style={{ border: "1px solid #e5ddcf", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong>{product.name}</strong>
                  <p style={{ margin: "6px 0 0" }}>
                    {product.category} • {product.origin}
                  </p>
                </div>
                <span style={{ fontWeight: 700, color: "#8a5a3c" }}>{product.badge}</span>
              </div>
              <p style={{ margin: "10px 0 0" }}>{product.summary}</p>
              <p style={{ margin: "10px 0 0", color: "#6b5b4c" }}>
                {product.price} • {product.moq} • {product.leadTime}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="card developer-panel">
        <h3 style={{ marginBottom: 16 }}>Shipment удирдлага</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {shipments.map((shipment) => {
            const current = updateState[shipment.trackingCode] ?? {
              status: shipment.currentStatus,
              details: "",
              location: "",
              busy: false,
              error: "",
            }

            return (
              <article key={shipment.id} className="developer-item-card" style={{ border: "1px solid #e5ddcf", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <strong>{shipment.trackingCode}</strong>
                    <p style={{ margin: "6px 0 0" }}>
                      {shipment.customerName} • {shipment.origin} -&gt; {shipment.destination}
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, color: "#8a5a3c" }}>{labelForStatus(shipment.currentStatus)}</span>
                </div>

                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <select value={current.status} onChange={(event) => setUpdateState((state) => ({ ...state, [shipment.trackingCode]: { ...current, status: event.target.value as ShipmentStatus } }))} className="admin-input">
                    {shipmentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {labelForStatus(status)}
                      </option>
                    ))}
                  </select>
                  <input value={current.location} onChange={(event) => setUpdateState((state) => ({ ...state, [shipment.trackingCode]: { ...current, location: event.target.value } }))} placeholder="Байршил" className="admin-input" />
                  <input value={current.details} onChange={(event) => setUpdateState((state) => ({ ...state, [shipment.trackingCode]: { ...current, details: event.target.value } }))} placeholder="Төлөвийн тайлбар" className="admin-input" />
                </div>

                {current.error ? <p style={{ margin: "10px 0 0", color: "#b42318", fontWeight: 700 }}>{current.error}</p> : null}

                <button className="btn btn-secondary" type="button" style={{ marginTop: 12 }} onClick={() => addEvent(shipment.trackingCode)} disabled={current.busy}>
                  {current.busy ? "Шинэчилж байна..." : "Төлөв шинэчлэх"}
                </button>

                <button
                  className="btn btn-secondary"
                  type="button"
                  style={{ marginTop: 12, marginLeft: 10 }}
                  onClick={() => void loadShipmentEvents(shipment.trackingCode)}
                  disabled={current.busy || shipment.eventsLoaded}
                >
                  {shipment.eventsLoaded ? "Түүх ачаалсан" : "Түүх ачаалах"}
                </button>

                <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                  {shipment.eventsLoaded ? shipment.events.map((event) => (
                    <div key={event.id} className="developer-timeline-item" style={{ borderLeft: "3px solid #d8b98a", paddingLeft: 12 }}>
                      <strong>{labelForStatus(event.status)}</strong>
                      <p style={{ margin: "4px 0" }}>{event.details}</p>
                      <p style={{ margin: 0, color: "#6b5b4c", fontSize: "0.92rem" }}>
                        {event.location} • {new Date(event.happenedAt).toLocaleString("mn-MN")}
                      </p>
                    </div>
                  )) : <p style={{ margin: 0, color: "#6b5b4c" }}>Түүхийг тусад нь ачаална.</p>}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
