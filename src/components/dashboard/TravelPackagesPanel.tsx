"use client"

import type { ChangeEvent } from "react"
import type { StoredTravelPackage } from "../../lib/server/travel-package-store"
import type { TravelPackageForm } from "./types"

type TravelPackagesPanelProps = {
  travelPackages: StoredTravelPackage[]
  form: TravelPackageForm
  error: string
  busy: boolean
  setForm: (updater: (form: TravelPackageForm) => TravelPackageForm) => void
  createTravelPackage: () => void
}

export function TravelPackageCreatePanel(props: TravelPackagesPanelProps) {
  return (
    <section className="card developer-panel">
      <h3 style={{ marginBottom: 16 }}>Нүүр хэсэгт аялал нэмэх</h3>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Input field="title" placeholder="Аяллын нэр" {...props} />
        <Input field="location" placeholder="Байршил" {...props} />
        <Input field="category" placeholder="Төрөл" {...props} />
        <Input field="duration" placeholder="Хугацаа" {...props} />
        <Input field="groupSize" placeholder="Хэдэн хүнтэй аялал" {...props} />
        <Input field="startDate" placeholder="Эхлэх огноо" {...props} />
        <Input field="adultPrice" placeholder="Том хүний үнэ" {...props} />
        <Input field="childPrice" placeholder="Хүүхдийн үнэ" {...props} />
        <Input field="infantPrice" placeholder="Нярайн үнэ" {...props} />
        <Input field="singleRoomPrice" placeholder="Ганцаараа байрлах нэмэлт" {...props} />
        <Input field="transport" placeholder="Тээвэр" {...props} />
        <Input field="hotel" placeholder="Буудал" {...props} />
        <Input field="language" placeholder="Хөтчийн хэл" {...props} />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 12 }}>
        <label className="developer-form-block">
          <span>Нүүр зураг оруулах</span>
          <input type="file" accept="image/*" className="admin-input" onChange={(event) => readImageFile(event, (image) => props.setForm((state) => ({ ...state, heroImage: image })))} />
        </label>
        <label className="developer-form-block">
          <span>Эсвэл нүүр зураг URL</span>
          <input value={props.form.heroImage.startsWith("data:") ? "" : props.form.heroImage} onChange={(event) => props.setForm((state) => ({ ...state, heroImage: event.target.value }))} placeholder="https://..." className="admin-input" />
        </label>
      </div>

      {props.form.heroImage ? <div className="travel-admin-preview" style={{ backgroundImage: `url(${props.form.heroImage})` }} /> : null}

      <textarea value={props.form.summary} onChange={(event) => props.setForm((state) => ({ ...state, summary: event.target.value }))} placeholder="Карт болон дэлгэрэнгүй дээр гарах товч мэдээлэл" className="admin-input" style={{ width: "100%", minHeight: 88, marginTop: 12, resize: "vertical" }} />
      <textarea value={props.form.galleryImagesText} onChange={(event) => props.setForm((state) => ({ ...state, galleryImagesText: event.target.value }))} placeholder="Нэмэлт зурагнуудын URL, мөр мөрөөр" className="admin-input" style={{ width: "100%", minHeight: 76, marginTop: 12, resize: "vertical" }} />

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 12 }}>
        <textarea value={props.form.includedText} onChange={(event) => props.setForm((state) => ({ ...state, includedText: event.target.value }))} placeholder="Үнэд багтсан зүйлс, мөр мөрөөр" className="admin-input" style={{ minHeight: 140, resize: "vertical" }} />
        <textarea value={props.form.excludedText} onChange={(event) => props.setForm((state) => ({ ...state, excludedText: event.target.value }))} placeholder="Үнэд багтаагүй зүйлс, мөр мөрөөр" className="admin-input" style={{ minHeight: 140, resize: "vertical" }} />
      </div>

      <ItineraryEditor form={props.form} setForm={props.setForm} />

      <textarea value={props.form.warning} onChange={(event) => props.setForm((state) => ({ ...state, warning: event.target.value }))} placeholder="Анхааруулга / нэмэлт нөхцөл" className="admin-input" style={{ width: "100%", minHeight: 76, marginTop: 12, resize: "vertical" }} />
      {props.error ? <p style={{ margin: "12px 0 0", color: "#b42318", fontWeight: 700 }}>{props.error}</p> : null}
      <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={props.createTravelPackage} disabled={props.busy}>
        {props.busy ? "Нэмж байна..." : "Аялал нийтлэх"}
      </button>
    </section>
  )
}

export function TravelPackageListPanel({ travelPackages }: { travelPackages: StoredTravelPackage[] }) {
  return (
    <section className="card developer-panel">
      <h3 style={{ marginBottom: 16 }}>Зарлагдсан аялалууд</h3>
      <div style={{ display: "grid", gap: 14 }}>
        {travelPackages.map((item) => (
          <article key={item.id} className="developer-item-card" style={{ border: "1px solid #e5ddcf", borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div className="travel-admin-thumb" style={{ backgroundImage: `url(${item.heroImage})` }} />
              <div style={{ flex: "1 1 260px" }}>
                <strong>{item.title}</strong>
                <p style={{ margin: "6px 0 0" }}>{item.location} - {item.duration} - {item.groupSize}</p>
                <p style={{ margin: "8px 0 0", color: "#6b5b4c" }}>Эхлэх үнэ: {formatMoney(item.adultPrice)}</p>
              </div>
            </div>
          </article>
        ))}
        {travelPackages.length === 0 ? <p style={{ margin: 0, color: "#6b5b4c" }}>Одоогоор аялал нийтлэгдээгүй байна.</p> : null}
      </div>
    </section>
  )
}

function ItineraryEditor(props: Pick<TravelPackagesPanelProps, "form" | "setForm">) {
  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <strong>Аяллын хөтөлбөр</strong>
      {props.form.itinerary.map((day, index) => (
        <div key={index} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <input value={day.day} onChange={(event) => updateItinerary(props, index, { day: event.target.value })} placeholder="Өдөр-1" className="admin-input" />
          <input value={day.date} onChange={(event) => updateItinerary(props, index, { date: event.target.value })} placeholder="2026-06-14" className="admin-input" />
          <input value={day.title} onChange={(event) => updateItinerary(props, index, { title: event.target.value })} placeholder="Гарчиг" className="admin-input" />
          <textarea value={day.details} onChange={(event) => updateItinerary(props, index, { details: event.target.value })} placeholder="Дэлгэрэнгүй" className="admin-input" style={{ minHeight: 52, resize: "vertical" }} />
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={() => props.setForm((state) => ({ ...state, itinerary: [...state.itinerary, { day: `Өдөр-${state.itinerary.length + 1}`, date: "", title: "", details: "" }] }))}>
        Өдөр нэмэх
      </button>
    </div>
  )
}

function updateItinerary(props: Pick<TravelPackagesPanelProps, "form" | "setForm">, index: number, patch: Partial<TravelPackageForm["itinerary"][number]>) {
  props.setForm((state) => ({
    ...state,
    itinerary: state.itinerary.map((day, currentIndex) => (currentIndex === index ? { ...day, ...patch } : day)),
  }))
}

function Input(props: TravelPackagesPanelProps & { field: keyof TravelPackageForm; placeholder: string }) {
  return <input value={String(props.form[props.field])} onChange={(event) => props.setForm((state) => ({ ...state, [props.field]: event.target.value }))} placeholder={props.placeholder} className="admin-input" />
}

function readImageFile(event: ChangeEvent<HTMLInputElement>, onDone: (image: string) => void) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === "string") onDone(reader.result)
  }
  reader.readAsDataURL(file)
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`
}
