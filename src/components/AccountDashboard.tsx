"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  getCurrentSession,
  type ServiceRequest,
  type SessionUser,
  type ShipmentTracking,
  type UserProfile,
} from "../lib/auth"

type AccountDashboardProps = {
  initialServiceType?: string
  initialTitle?: string
}

type ProfileFormState = {
  phone: string
  companyName: string
  telegramHandle: string
  customerTypes: string[]
  notes: string
}

const serviceTypeOptions = [
  { value: "product_sourcing", label: "Бараа авах / sourcing" },
  { value: "cargo", label: "Карго / shipment" },
  { value: "travel", label: "Аялал / route planning" },
  { value: "esim", label: "eSIM дата багц" },
] as const

const customerTypeOptions = [
  { value: "merchant", label: "Бараа авагч / reseller" },
  { value: "cargo_customer", label: "Карго хэрэглэгч" },
  { value: "traveler", label: "Аялагч" },
  { value: "esim_customer", label: "eSIM хэрэглэгч" },
] as const

function createProfileState(profile?: UserProfile | null): ProfileFormState {
  return {
    phone: profile?.phone ?? "",
    companyName: profile?.companyName ?? "",
    telegramHandle: profile?.telegramHandle ?? "",
    customerTypes: profile?.customerTypes ?? [],
    notes: profile?.notes ?? "",
  }
}

function labelForStatus(status: ServiceRequest["status"]): string {
  switch (status) {
    case "new":
      return "Шинэ"
    case "contacted":
      return "Холбогдсон"
    case "quoted":
      return "Үнийн санал"
    case "confirmed":
      return "Баталгаажсан"
    case "completed":
      return "Дууссан"
    case "cancelled":
      return "Цуцлагдсан"
  }
}

function labelForShipmentStatus(status: ShipmentTracking["shipment"]["currentStatus"]): string {
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

export default function AccountDashboard({ initialServiceType, initialTitle }: AccountDashboardProps) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [profileForm, setProfileForm] = useState<ProfileFormState>(createProfileState())
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [shipments, setShipments] = useState<ShipmentTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [profileMessage, setProfileMessage] = useState("")
  const [profileBusy, setProfileBusy] = useState(false)
  const [requestBusy, setRequestBusy] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")
  const [requestForm, setRequestForm] = useState({
    serviceType: initialServiceType && serviceTypeOptions.some((item) => item.value === initialServiceType)
      ? initialServiceType
      : "product_sourcing",
    title: initialTitle ?? "",
    details: "",
    budget: "",
    travelDate: "",
  })

  useEffect(() => {
    let active = true

    async function load(): Promise<void> {
      setLoading(true)
      setLoadError("")

      const session = await getCurrentSession()

      if (!active) return

      if (!session.user) {
        setLoading(false)
        setLoadError("Нэвтэрсэн хэрэглэгч олдсонгүй.")
        return
      }

      setUser(session.user)
      setProfileForm(createProfileState(session.profile))

      const [profileResponse, requestsResponse, shipmentsResponse] = await Promise.all([
        fetch("/api/account/profile", { cache: "no-store" }),
        fetch("/api/account/service-requests", { cache: "no-store" }),
        fetch("/api/account/shipments", { cache: "no-store" }),
      ])

      if (!active) return

      const [profileBody, requestsBody, shipmentsBody] = await Promise.all([
        profileResponse.json() as Promise<{ profile?: UserProfile; message?: string }>,
        requestsResponse.json() as Promise<{ requests?: ServiceRequest[]; message?: string }>,
        shipmentsResponse.json() as Promise<{ shipments?: ShipmentTracking[]; message?: string }>,
      ])

      if (profileResponse.ok && profileBody.profile) {
        setProfileForm(createProfileState(profileBody.profile))
      }

      if (requestsResponse.ok) {
        setServiceRequests(requestsBody.requests ?? [])
      }

      if (shipmentsResponse.ok) {
        setShipments(shipmentsBody.shipments ?? [])
      }

      if (!profileResponse.ok || !requestsResponse.ok || !shipmentsResponse.ok) {
        setLoadError(
          profileBody.message ??
            requestsBody.message ??
            shipmentsBody.message ??
            "Account мэдээлэл ачаалахад алдаа гарлаа."
        )
      }

      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [])

  async function saveProfile(): Promise<void> {
    setProfileBusy(true)
    setProfileMessage("")

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    })

    const body = (await response.json()) as { profile?: UserProfile; message?: string }
    setProfileBusy(false)

    if (!response.ok || !body.profile) {
      setProfileMessage(body.message ?? "Профайл хадгалахад алдаа гарлаа.")
      return
    }

    setProfileForm(createProfileState(body.profile))
    setProfileMessage("Профайл амжилттай хадгалагдлаа.")
  }

  async function createRequest(): Promise<void> {
    setRequestBusy(true)
    setRequestMessage("")

    const response = await fetch("/api/account/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestForm),
    })

    const body = (await response.json()) as { request?: ServiceRequest; message?: string }
    setRequestBusy(false)

    if (!response.ok || !body.request) {
      setRequestMessage(body.message ?? "Хүсэлт илгээхэд алдаа гарлаа.")
      return
    }

    setServiceRequests((current) => [body.request!, ...current])
    setRequestForm((current) => ({
      ...current,
      title: "",
      details: "",
      budget: "",
      travelDate: "",
    }))
    setRequestMessage("Хүсэлт амжилттай илгээгдлээ.")
  }

  if (loading) {
    return <div className="card"><p style={{ margin: 0 }}>Account ачаалж байна...</p></div>
  }

  if (!user) {
    return (
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Account ашиглахын тулд нэвтэрнэ үү</h2>
        <p style={{ margin: 0 }}>Имэйлээр бүртгүүлээд өөрийн бараа, карго, eSIM, аяллын хүсэлтээ нэг дор удирдах боломжтой.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/login">Нэвтрэх</Link>
          <Link className="btn btn-secondary" href="/shop">Shop үзэх</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="card-grid">
        <article className="card" style={{ gridColumn: "span 4" }}>
          <h3 style={{ marginTop: 0 }}>Account</h3>
          <p style={{ marginBottom: 0 }}>{user.name}</p>
        </article>
        <article className="card" style={{ gridColumn: "span 4" }}>
          <h3 style={{ marginTop: 0 }}>Имэйл</h3>
          <p style={{ marginBottom: 0 }}>{user.email}</p>
        </article>
        <article className="card" style={{ gridColumn: "span 4" }}>
          <h3 style={{ marginTop: 0 }}>Хүсэлт</h3>
          <p style={{ marginBottom: 0 }}>{serviceRequests.length} идэвхтэй / түүхэн хүсэлт</p>
        </article>
        <article className="card" style={{ gridColumn: "span 4" }}>
          <h3 style={{ marginTop: 0 }}>Карго</h3>
          <p style={{ marginBottom: 0 }}>{shipments.length} shipment энэ имэйлтэй холбогдсон</p>
        </article>
      </section>

      {loadError ? (
        <section className="card">
          <p style={{ margin: 0, color: "#b42318", fontWeight: 700 }}>{loadError}</p>
        </section>
      ) : null}

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Профайл</h2>
            <p style={{ margin: "6px 0 0", color: "#6b5b4c" }}>Бараа авах, карго, аялал, eSIM хүсэлтүүд энэ имэйлтэй чинь холбогдоно.</p>
          </div>
          {user.role === "developer" ? <Link className="btn btn-secondary" href="/developer">Хөгжүүлэгчийн хэсэг</Link> : null}
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <input className="admin-input" placeholder="Утас" value={profileForm.phone} onChange={(event) => setProfileForm((state) => ({ ...state, phone: event.target.value }))} />
          <input className="admin-input" placeholder="Компани / shop нэр" value={profileForm.companyName} onChange={(event) => setProfileForm((state) => ({ ...state, companyName: event.target.value }))} />
          <input className="admin-input" placeholder="Telegram" value={profileForm.telegramHandle} onChange={(event) => setProfileForm((state) => ({ ...state, telegramHandle: event.target.value }))} />
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <strong>Таны хэрэглээ</strong>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {customerTypeOptions.map((option) => {
              const selected = profileForm.customerTypes.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  className={selected ? "btn btn-primary" : "btn btn-secondary"}
                  style={{ padding: "8px 14px" }}
                  onClick={() =>
                    setProfileForm((state) => ({
                      ...state,
                      customerTypes: selected
                        ? state.customerTypes.filter((item) => item !== option.value)
                        : [...state.customerTypes, option.value],
                    }))
                  }
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <textarea
          className="admin-input"
          style={{ width: "100%", minHeight: 92, marginTop: 14, resize: "vertical" }}
          placeholder="Тэмдэглэл: ямар бараа авч/зардаг, хэдийд аялалтай, ямар карго урсгалтай гэх мэт"
          value={profileForm.notes}
          onChange={(event) => setProfileForm((state) => ({ ...state, notes: event.target.value }))}
        />

        {profileMessage ? <p style={{ margin: "12px 0 0", color: profileMessage.includes("алдаа") ? "#b42318" : "#1d6b42", fontWeight: 700 }}>{profileMessage}</p> : null}

        <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={saveProfile} disabled={profileBusy}>
          {profileBusy ? "Хадгалж байна..." : "Профайл хадгалах"}
        </button>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Шинэ хүсэлт үүсгэх</h2>
        <p style={{ color: "#6b5b4c" }}>Худалдааны бараа, карго, eSIM, аяллын хүсэлтээ бүгдийг өөрийн account-аасаа илгээнэ.</p>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <select className="admin-input" value={requestForm.serviceType} onChange={(event) => setRequestForm((state) => ({ ...state, serviceType: event.target.value }))}>
            {serviceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input className="admin-input" placeholder="Гарчиг" value={requestForm.title} onChange={(event) => setRequestForm((state) => ({ ...state, title: event.target.value }))} />
          <input className="admin-input" placeholder="Төсөв / захиалгын хэмжээ" value={requestForm.budget} onChange={(event) => setRequestForm((state) => ({ ...state, budget: event.target.value }))} />
          <input className="admin-input" placeholder="Аяллын огноо / хэрэгтэй хугацаа" value={requestForm.travelDate} onChange={(event) => setRequestForm((state) => ({ ...state, travelDate: event.target.value }))} />
        </div>

        <textarea
          className="admin-input"
          style={{ width: "100%", minHeight: 92, marginTop: 12, resize: "vertical" }}
          placeholder="Жишээ: 500 ширхэг гоо сайхны савлагаа хайж байна, Гуанжоугаас Улаанбаатарын карготой уяад өгөөч"
          value={requestForm.details}
          onChange={(event) => setRequestForm((state) => ({ ...state, details: event.target.value }))}
        />

        {requestMessage ? <p style={{ margin: "12px 0 0", color: requestMessage.includes("алдаа") ? "#b42318" : "#1d6b42", fontWeight: 700 }}>{requestMessage}</p> : null}

        <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={createRequest} disabled={requestBusy}>
          {requestBusy ? "Илгээж байна..." : "Хүсэлт илгээх"}
        </button>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Миний хүсэлтүүд</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {serviceRequests.length === 0 ? <p style={{ margin: 0 }}>Одоогоор хүсэлт алга. Дээрээс шууд шинээр үүсгэж болно.</p> : null}
          {serviceRequests.map((request) => (
            <article key={request.id} style={{ border: "1px solid #e5ddcf", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong>{request.title}</strong>
                  <p style={{ margin: "6px 0 0", color: "#6b5b4c" }}>{request.serviceType} • {new Date(request.createdAt).toLocaleString("mn-MN")}</p>
                </div>
                <span style={{ fontWeight: 700, color: "#8a5a3c" }}>{labelForStatus(request.status)}</span>
              </div>
              <p style={{ margin: "10px 0 0" }}>{request.details}</p>
              {(request.budget || request.travelDate) ? (
                <p style={{ margin: "10px 0 0", color: "#6b5b4c" }}>
                  {request.budget ? `Төсөв: ${request.budget}` : ""}
                  {request.budget && request.travelDate ? " • " : ""}
                  {request.travelDate ? `Хугацаа: ${request.travelDate}` : ""}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Миний cargo shipment-үүд</h2>
        <div style={{ display: "grid", gap: 14 }}>
          {shipments.length === 0 ? <p style={{ margin: 0 }}>Энэ имэйл дээр холбоотой shipment одоохондоо алга. Карго үүсгүүлэх бол хүсэлтээрээ имэйлээ ашиглаарай.</p> : null}
          {shipments.map((item) => (
            <article key={item.shipment.id} style={{ border: "1px solid #e5ddcf", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong>{item.shipment.trackingCode}</strong>
                  <p style={{ margin: "6px 0 0" }}>{item.shipment.origin} -&gt; {item.shipment.destination}</p>
                </div>
                <span style={{ fontWeight: 700, color: "#8a5a3c" }}>{labelForShipmentStatus(item.shipment.currentStatus)}</span>
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {item.events.map((event) => (
                  <div key={event.id} style={{ borderLeft: "3px solid #d8b98a", paddingLeft: 12 }}>
                    <strong>{labelForShipmentStatus(event.status)}</strong>
                    <p style={{ margin: "4px 0" }}>{event.details}</p>
                    <p style={{ margin: 0, color: "#6b5b4c", fontSize: "0.92rem" }}>
                      {event.location} • {new Date(event.happenedAt).toLocaleString("mn-MN")}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
