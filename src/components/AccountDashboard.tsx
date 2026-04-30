"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getCurrentSession, type ServiceRequest, type SessionUser, type ShipmentTracking, type UserProfile } from "../lib/auth"
import { roleHomePath } from "../lib/role-path"

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

export default function AccountDashboard({ initialServiceType, initialTitle }: AccountDashboardProps) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [profileForm, setProfileForm] = useState<ProfileFormState>(createProfileState())
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [shipments, setShipments] = useState<ShipmentTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [profileBusy, setProfileBusy] = useState(false)
  const [requestBusy, setRequestBusy] = useState(false)
  const [requestForm, setRequestForm] = useState({
    serviceType: initialServiceType && serviceTypeOptions.some((item) => item.value === initialServiceType) ? initialServiceType : "product_sourcing",
    title: initialTitle ?? "",
    details: "",
    budget: "",
    travelDate: "",
  })

  useEffect(() => {
    let active = true
    async function load(): Promise<void> {
      const session = await getCurrentSession()
      if (!active) return
      if (!session.user) {
        setMessage("Нэвтэрсэн хэрэглэгч олдсонгүй.")
        setLoading(false)
        return
      }
      setUser(session.user)
      setProfileForm(createProfileState(session.profile))
      const [profile, serviceRequests, shipmentList] = await Promise.all([
        readAccountApi<{ profile?: UserProfile }>("/api/account/profile"),
        readAccountApi<{ requests?: ServiceRequest[] }>("/api/account/service-requests"),
        readAccountApi<{ shipments?: ShipmentTracking[] }>("/api/account/shipments"),
      ])
      if (!active) return
      if (profile.profile) setProfileForm(createProfileState(profile.profile))
      setRequests(serviceRequests.requests ?? [])
      setShipments(shipmentList.shipments ?? [])
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  async function saveProfile(): Promise<void> {
    setProfileBusy(true)
    const body = await writeAccountApi<{ profile?: UserProfile }>("/api/account/profile", "PATCH", profileForm)
    setProfileBusy(false)
    if (!body.profile) return setMessage("Профайл хадгалахад алдаа гарлаа.")
    setProfileForm(createProfileState(body.profile))
    setMessage("Профайл хадгалагдлаа.")
  }

  async function createRequest(): Promise<void> {
    setRequestBusy(true)
    const body = await writeAccountApi<{ request?: ServiceRequest }>("/api/account/service-requests", "POST", requestForm)
    setRequestBusy(false)
    if (!body.request) return setRequestMessage("Хүсэлт илгээхэд алдаа гарлаа.")
    setRequests((current) => [body.request!, ...current])
    setRequestForm((current) => ({ ...current, title: "", details: "", budget: "", travelDate: "" }))
    setRequestMessage("Хүсэлт илгээгдлээ.")
  }

  if (loading) return <div className="card"><p style={{ margin: 0 }}>Account ачаалж байна...</p></div>
  if (!user) return <GuestCard />

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Summary user={user} requests={requests} shipments={shipments} />
      {message ? <Notice text={message} /> : null}
      <ProfilePanel user={user} form={profileForm} setForm={setProfileForm} busy={profileBusy} onSave={saveProfile} />
      <RequestPanel form={requestForm} setForm={setRequestForm} busy={requestBusy} message={requestMessage} onCreate={createRequest} />
      <RequestList requests={requests} />
      <ShipmentList shipments={shipments} />
    </div>
  )
}

function createProfileState(profile?: UserProfile | null): ProfileFormState {
  return { phone: profile?.phone ?? "", companyName: profile?.companyName ?? "", telegramHandle: profile?.telegramHandle ?? "", customerTypes: profile?.customerTypes ?? [], notes: profile?.notes ?? "" }
}

async function readAccountApi<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" })
  return response.ok ? response.json() : ({} as T)
}

async function writeAccountApi<T>(url: string, method: "PATCH" | "POST", body: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  return response.ok ? response.json() : ({} as T)
}

function GuestCard() {
  return <div className="card"><h2>Account ашиглахын тулд нэвтэрнэ үү</h2><Link className="btn btn-primary" href="/login">Нэвтрэх</Link></div>
}

function Notice({ text }: { text: string }) {
  return <section className="card"><p style={{ margin: 0, color: text.includes("алдаа") ? "#b42318" : "#1d6b42", fontWeight: 700 }}>{text}</p></section>
}

function Summary({ user, requests, shipments }: { user: SessionUser; requests: ServiceRequest[]; shipments: ShipmentTracking[] }) {
  return <section className="card-grid"><Stat title="Account" value={user.name} /><Stat title="Имэйл" value={user.email} /><Stat title="Хүсэлт" value={`${requests.length} хүсэлт`} /><Stat title="Карго" value={`${shipments.length} shipment`} /></section>
}

function Stat({ title, value }: { title: string; value: string }) {
  return <article className="card" style={{ gridColumn: "span 4" }}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ marginBottom: 0 }}>{value}</p></article>
}

function ProfilePanel(props: { user: SessionUser; form: ProfileFormState; setForm: React.Dispatch<React.SetStateAction<ProfileFormState>>; busy: boolean; onSave: () => void }) {
  const staffPath = roleHomePath(props.user.roles)
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>Профайл</h2>{staffPath !== "/account" ? <Link className="btn btn-secondary" href={staffPath}>Ажилтны хэсэг</Link> : null}</div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 14 }}>
        <Input value={props.form.phone} placeholder="Утас" onChange={(value) => props.setForm((state) => ({ ...state, phone: value }))} />
        <Input value={props.form.companyName} placeholder="Компани / shop нэр" onChange={(value) => props.setForm((state) => ({ ...state, companyName: value }))} />
        <Input value={props.form.telegramHandle} placeholder="Telegram" onChange={(value) => props.setForm((state) => ({ ...state, telegramHandle: value }))} />
      </div>
      <OptionButtons selected={props.form.customerTypes} onChange={(customerTypes) => props.setForm((state) => ({ ...state, customerTypes }))} />
      <textarea className="admin-input" style={{ width: "100%", minHeight: 92, marginTop: 14 }} value={props.form.notes} onChange={(event) => props.setForm((state) => ({ ...state, notes: event.target.value }))} placeholder="Тэмдэглэл" />
      <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={props.onSave} disabled={props.busy}>{props.busy ? "Хадгалж байна..." : "Профайл хадгалах"}</button>
    </section>
  )
}

function RequestPanel(props: { form: { serviceType: string; title: string; details: string; budget: string; travelDate: string }; setForm: React.Dispatch<React.SetStateAction<{ serviceType: string; title: string; details: string; budget: string; travelDate: string }>>; busy: boolean; message: string; onCreate: () => void }) {
  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Шинэ хүсэлт үүсгэх</h2>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <select className="admin-input" value={props.form.serviceType} onChange={(event) => props.setForm((state) => ({ ...state, serviceType: event.target.value }))}>{serviceTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        {(["title", "budget", "travelDate"] as const).map((field) => <Input key={field} value={props.form[field]} placeholder={field} onChange={(value) => props.setForm((state) => ({ ...state, [field]: value }))} />)}
      </div>
      <textarea className="admin-input" style={{ width: "100%", minHeight: 92, marginTop: 12 }} value={props.form.details} onChange={(event) => props.setForm((state) => ({ ...state, details: event.target.value }))} placeholder="Дэлгэрэнгүй" />
      {props.message ? <p style={{ fontWeight: 700 }}>{props.message}</p> : null}
      <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={props.onCreate} disabled={props.busy}>{props.busy ? "Илгээж байна..." : "Хүсэлт илгээх"}</button>
    </section>
  )
}

function OptionButtons(props: { selected: string[]; onChange: (value: string[]) => void }) {
  return <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>{customerTypeOptions.map((option) => <button key={option.value} type="button" className={props.selected.includes(option.value) ? "btn btn-primary" : "btn btn-secondary"} onClick={() => props.onChange(props.selected.includes(option.value) ? props.selected.filter((item) => item !== option.value) : [...props.selected, option.value])}>{option.label}</button>)}</div>
}

function RequestList({ requests }: { requests: ServiceRequest[] }) {
  return <section className="card"><h2 style={{ marginTop: 0 }}>Миний хүсэлтүүд</h2>{requests.map((request) => <article key={request.id} style={{ borderTop: "1px solid #e5ddcf", padding: 12 }}><strong>{request.title}</strong><p>{request.details}</p></article>)}</section>
}

function ShipmentList({ shipments }: { shipments: ShipmentTracking[] }) {
  return <section className="card"><h2 style={{ marginTop: 0 }}>Миний cargo shipment-үүд</h2>{shipments.map((item) => <article key={item.shipment.id} style={{ borderTop: "1px solid #e5ddcf", padding: 12 }}><strong>{item.shipment.trackingCode}</strong><p>{item.shipment.origin} -&gt; {item.shipment.destination}</p></article>)}</section>
}

function Input(props: { value: string; placeholder: string; onChange: (value: string) => void }) {
  return <input className="admin-input" placeholder={props.placeholder} value={props.value} onChange={(event) => props.onChange(event.target.value)} />
}

