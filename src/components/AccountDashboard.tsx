"use client"

import { useEffect, useState } from "react"
import { useAppLoading } from "./ui/LoadingProvider"

type AccountDashboardProps = {
  initialServiceType?: string
  initialTitle?: string
  returnTo?: string
}

type ProfileFormState = {
  name: string
  email: string
  phone: string
  city: string
  companyName: string
}

export default function AccountDashboard({ initialServiceType, initialTitle, returnTo }: AccountDashboardProps) {
  void initialServiceType
  void initialTitle
  const { runWithLoading } = useAppLoading()

  const [form, setForm] = useState<ProfileFormState>(createProfileState())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true
    async function load(): Promise<void> {
      const body = await runWithLoading(() => readAccountApi<{ profile?: ProfileFormState }>("/api/account/profile"))
      if (!active) return

      if (!body?.profile) {
        setMessage("Профайл мэдээлэл ачаалахад алдаа гарлаа.")
        setLoading(false)
        return
      }

      setForm(createProfileState(body.profile))
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [runWithLoading])

  async function saveProfile(): Promise<void> {
    setSaving(true)
    setMessage("")
    let body: { profile?: ProfileFormState } = {}
    try {
      body = await runWithLoading(() => writeAccountApi<{ profile?: ProfileFormState }>("/api/account/profile", form))
    } finally {
      setSaving(false)
    }

    if (!body.profile) {
      setMessage("Профайл хадгалахад алдаа гарлаа.")
      return
    }

    setForm(createProfileState(body.profile))
    setMessage("Хувийн мэдээлэл хадгалагдлаа.")
    const target = safeReturnTo(returnTo)
    if (target) {
      window.setTimeout(() => {
        window.location.assign(target)
      }, 900)
    }
  }

  if (loading) {
    return <section className="account-profile-panel"><p className="account-muted">Хувийн мэдээлэл ачаалж байна...</p></section>
  }

  return (
    <section className="account-profile-panel account-profile-form-panel">
      

      {message ? <p className={message.includes("алдаа") ? "account-error" : "account-success"}>{message}</p> : null}

      <div className="account-form-grid">
        <Input label="Нэр" value={form.name} onChange={(value) => setForm((state) => ({ ...state, name: value }))} />
        <ReadOnlyField label="Имэйл" value={form.email} />
        <Input label="Утас" value={form.phone} onChange={(value) => setForm((state) => ({ ...state, phone: value }))} />
        <Input label="Байршил / хот" value={form.city} onChange={(value) => setForm((state) => ({ ...state, city: value }))} />
        <Input label="Компани / дэлгүүр нэр" value={form.companyName} onChange={(value) => setForm((state) => ({ ...state, companyName: value }))} />
      </div>

      <button className="account-save-button" type="button" onClick={saveProfile} disabled={saving}>
        {saving ? "Хадгалж байна..." : "Хадгалах"}
      </button>
    </section>
  )
}

function createProfileState(profile?: Partial<ProfileFormState> | null): ProfileFormState {
  return {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    companyName: profile?.companyName ?? "",
  }
}

function safeReturnTo(value: string | undefined): string {
  if (!value?.startsWith("/")) return ""
  if (value.startsWith("//") || value.startsWith("/login") || value.startsWith("/account")) return ""
  return value
}

async function readAccountApi<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store" })
  return response.ok ? response.json() : null
}

async function writeAccountApi<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  return response.ok ? response.json() : ({} as T)
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div className="account-field readonly"><span>{label}</span><strong>{value || "-"}</strong></div>
}

function Input(props: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="account-field"><span>{props.label}</span><input value={props.value} onChange={(event) => props.onChange(event.target.value)} /></label>
}
