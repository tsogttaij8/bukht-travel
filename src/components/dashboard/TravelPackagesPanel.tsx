"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  Bike,
  Bus,
  CalendarDays,
  Car,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Footprints,
  Gauge,
  ImageIcon,
  ListChecks,
  MapPin,
  Mountain,
  Plane,
  Plus,
  Settings,
  TableProperties,
  TrainFront,
  Trash2,
  Wallet,
} from "lucide-react"
import type { StoredTravelPackage, TravelItineraryDay, TravelPackageStatus } from "../../lib/server/travel-package-store"

type TravelPackagesPanelProps = {
  travelPackages?: StoredTravelPackage[]
}

type PortalSection = "dashboard" | "tours" | "editor" | "bookings" | "analytics" | "payments" | "settings"
type EditorStep = "basic" | "content" | "location" | "transport" | "itinerary" | "pricing" | "gallery" | "payment" | "review"

type OwnerTourForm = {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  destination: string
  startLocation: string
  endLocation: string
  mapCoordinates: string
  duration: string
  transportationTypesText: string
  itineraryText: string
  includedText: string
  excludedText: string
  price: string
  maxParticipants: string
  galleryImagesText: string
  paymentSettings: string
  cancellationPolicy: string
  status: TravelPackageStatus
}

const emptyForm: OwnerTourForm = {
  id: "",
  title: "",
  shortDescription: "",
  fullDescription: "",
  destination: "",
  startLocation: "",
  endLocation: "",
  mapCoordinates: "",
  duration: "",
  transportationTypesText: "",
  itineraryText: "",
  includedText: "",
  excludedText: "",
  price: "",
  maxParticipants: "",
  galleryImagesText: "",
  paymentSettings: "",
  cancellationPolicy: "",
  status: "draft",
}

const navItems = [
  { value: "dashboard" as const, label: "Dashboard", icon: Gauge },
  { value: "tours" as const, label: "Tours", icon: TableProperties },
  { value: "bookings" as const, label: "Bookings", icon: CalendarDays },
  { value: "analytics" as const, label: "Analytics", icon: BarChart3 },
  { value: "payments" as const, label: "Payments", icon: Wallet },
  { value: "settings" as const, label: "Settings", icon: Settings },
]

const editorSteps = [
  { value: "basic" as const, label: "Basic", icon: FileText },
  { value: "content" as const, label: "Experience", icon: ListChecks },
  { value: "location" as const, label: "Location", icon: MapPin },
  { value: "transport" as const, label: "Transport", icon: Bus },
  { value: "itinerary" as const, label: "Itinerary", icon: CalendarDays },
  { value: "pricing" as const, label: "Pricing", icon: DollarSign },
  { value: "gallery" as const, label: "Gallery", icon: ImageIcon },
  { value: "payment" as const, label: "Payment", icon: CreditCard },
  { value: "review" as const, label: "Review", icon: CheckCircle2 },
]

const transportOptions = [
  { label: "Car", icon: Car },
  { label: "Bus", icon: Bus },
  { label: "Airplane", icon: Plane },
  { label: "Train", icon: TrainFront },
  { label: "Motorcycle", icon: Bike },
  { label: "Walking", icon: Footprints },
  { label: "Horse riding", icon: Mountain },
]

export function TravelPackageCreatePanel(props: TravelPackagesPanelProps) {
  void props
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const [activeSection, setActiveSection] = useState<PortalSection>("dashboard")
  const [tours, setTours] = useState<StoredTravelPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState<OwnerTourForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [handledEditId, setHandledEditId] = useState("")

  const stats = useMemo(() => ({
    total: tours.length,
    published: tours.filter((tour) => tour.status === "published").length,
    draft: tours.filter((tour) => tour.status === "draft").length,
  }), [tours])

  async function loadTours(): Promise<void> {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/owner/tours", { cache: "no-store" })
      const body = (await response.json()) as { tours?: StoredTravelPackage[]; message?: string }
      if (!response.ok) throw new Error(body.message ?? "Failed to load tours.")
      setTours(body.tours ?? [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load tours.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTours()
  }, [])

  useEffect(() => {
    if (!editId || loading || handledEditId === editId) return
    const tour = tours.find((item) => item.id === editId || item.slug === editId)
    if (!tour) return
    startEdit(tour)
    setHandledEditId(editId)
  }, [editId, handledEditId, loading, tours])

  function startCreate() {
    setForm(emptyForm)
    setActiveSection("editor")
  }

  function startEdit(tour: StoredTravelPackage) {
    setForm(formFromTour(tour))
    setActiveSection("editor")
  }

  async function saveTour(nextStatus?: TravelPackageStatus): Promise<void> {
    setSaving(true)
    setError("")
    try {
      const payload = formToPayload({ ...form, status: nextStatus ?? form.status })
      const response = await fetch(form.id ? `/api/owner/tours/${encodeURIComponent(form.id)}` : "/api/owner/tours", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as { tour?: StoredTravelPackage; message?: string }
      if (!response.ok || !body.tour) throw new Error(body.message ?? "Failed to save tour.")
      setTours((current) => form.id ? current.map((tour) => tour.id === body.tour!.id ? body.tour! : tour) : [body.tour!, ...current])
      setForm(formFromTour(body.tour))
      setActiveSection("tours")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save tour.")
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(tour: StoredTravelPackage, status: TravelPackageStatus): Promise<void> {
    setError("")
    const response = await fetch(`/api/owner/tours/${encodeURIComponent(tour.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const body = (await response.json()) as { tour?: StoredTravelPackage; message?: string }
    if (!response.ok || !body.tour) return setError(body.message ?? "Failed to update status.")
    setTours((current) => current.map((item) => item.id === body.tour!.id ? body.tour! : item))
  }

  async function deleteTour(tour: StoredTravelPackage): Promise<void> {
    if (!window.confirm(`Delete "${tour.title}"?`)) return
    setError("")
    const response = await fetch(`/api/owner/tours/${encodeURIComponent(tour.id)}`, { method: "DELETE" })
    if (!response.ok) {
      const body = (await response.json()) as { message?: string }
      setError(body.message ?? "Failed to delete tour.")
      return
    }
    setTours((current) => current.filter((item) => item.id !== tour.id))
  }

  return (
    <section className="tour-provider-shell" aria-label="Tour provider workspace">
      <aside className="tour-provider-sidebar">
        <div className="tour-provider-brand">
          <strong>Bukht Travel</strong>
          <span>Supplier workspace</span>
        </div>
        <nav aria-label="Owner tour sections">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.value} type="button" className={activeSection === item.value ? "active" : ""} onClick={() => setActiveSection(item.value)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="tour-provider-main">
        <div className="tour-provider-topbar">
          <div>
            <p>Owner / Tour provider</p>
            <h2>{activeSection === "editor" ? (form.id ? "Edit tour" : "Create tour") : navItems.find((item) => item.value === activeSection)?.label}</h2>
          </div>
          <button type="button" className="tour-primary-action" onClick={startCreate}><Plus size={16} />New tour</button>
        </div>

        {error ? <p className="tour-error-box">{error}</p> : null}
        {loading ? <StatePanel title="Loading owner tours" body="Fetching real data from /api/owner/tours..." /> : null}
        {!loading && activeSection === "dashboard" ? <DashboardView stats={stats} tours={tours} onCreate={startCreate} onEdit={startEdit} onStatus={updateStatus} onDelete={deleteTour} /> : null}
        {!loading && activeSection === "tours" ? <ToursView tours={tours} onCreate={startCreate} onEdit={startEdit} onStatus={updateStatus} onDelete={deleteTour} /> : null}
        {!loading && activeSection === "editor" ? <EditorView form={form} setForm={setForm} saving={saving} onCancel={() => setActiveSection("tours")} onSave={saveTour} /> : null}
        {!loading && activeSection === "bookings" ? <StatePanel title="Bookings" body="No booking backend exists yet. Showing 0 bookings." /> : null}
        {!loading && activeSection === "analytics" ? <StatePanel title="Analytics" body="No booking or revenue data yet. Tour counts are calculated from real owner tours only." /> : null}
        {!loading && activeSection === "payments" ? <StatePanel title="Payments" body="No payment gateway or payment records exist yet. Revenue is 0." /> : null}
        {!loading && activeSection === "settings" ? <StatePanel title="Settings" body="Owner tour settings backend is not implemented yet." /> : null}
      </div>
    </section>
  )
}

export function TravelPackageListPanel(props: TravelPackagesPanelProps) {
  void props
  return null
}

function DashboardView(props: {
  stats: { total: number; published: number; draft: number }
  tours: StoredTravelPackage[]
  onCreate: () => void
  onEdit: (tour: StoredTravelPackage) => void
  onStatus: (tour: StoredTravelPackage, status: TravelPackageStatus) => void
  onDelete: (tour: StoredTravelPackage) => void
}) {
  return (
    <div className="tour-admin-stack">
      <div className="tour-admin-metrics">
        <Metric label="Total tours" value={String(props.stats.total)} detail="Real owner tours" />
        <Metric label="Draft tours" value={String(props.stats.draft)} detail="Not visible publicly" />
        <Metric label="Published tours" value={String(props.stats.published)} detail="Visible to customers" />
        <Metric label="Bookings" value="0" detail="No booking data yet" />
        <Metric label="Revenue" value="0" detail="No payment data yet" />
      </div>
      <ToursView title="My tours" tours={props.tours} onCreate={props.onCreate} onEdit={props.onEdit} onStatus={props.onStatus} onDelete={props.onDelete} />
    </div>
  )
}

function ToursView(props: {
  title?: string
  tours: StoredTravelPackage[]
  onCreate: () => void
  onEdit: (tour: StoredTravelPackage) => void
  onStatus: (tour: StoredTravelPackage, status: TravelPackageStatus) => void
  onDelete: (tour: StoredTravelPackage) => void
}) {
  if (props.tours.length === 0) {
    return (
      <section className="tour-admin-panel tour-empty-state">
        <div>
          <h3>No tours yet</h3>
          <p>Create a draft tour to start building your public travel inventory.</p>
        </div>
        <button type="button" className="tour-primary-action" onClick={props.onCreate}><Plus size={16} />Create first tour</button>
      </section>
    )
  }

  return (
    <section className="tour-admin-panel">
      <div className="tour-panel-head">
        <div>
          <h3>{props.title ?? "Tours"}</h3>
          <p>{props.tours.length} real records from /api/owner/tours</p>
        </div>
        <button type="button" className="tour-secondary-action" onClick={props.onCreate}><Plus size={15} />New tour</button>
      </div>
      <div className="tour-table-wrap">
        <table className="tour-data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Destination</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.tours.map((tour) => (
              <tr key={tour.id}>
                <td>
                  <div className="tour-table-title">
                    <strong>{tour.title}</strong>
                    <span>{tour.shortDescription || "No short description yet"}</span>
                  </div>
                </td>
                <td>{tour.destination}</td>
                <td>{formatMoney(tour.price)}</td>
                <td><StatusBadge status={tour.status} /></td>
                <td>{formatDate(tour.createdAt)}</td>
                <td>{formatDate(tour.updatedAt)}</td>
                <td>
                  <div className="tour-row-actions">
                    <button type="button" onClick={() => props.onEdit(tour)} title="Edit"><Edit size={15} /></button>
                    <Link href={`/owner/travel/tours/${tour.id}/preview`} title="Preview"><Eye size={15} /></Link>
                    <button type="button" onClick={() => props.onStatus(tour, tour.status === "published" ? "draft" : "published")}>
                      {tour.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" onClick={() => props.onDelete(tour)} title="Delete"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function EditorView(props: {
  form: OwnerTourForm
  setForm: (updater: (form: OwnerTourForm) => OwnerTourForm) => void
  saving: boolean
  onCancel: () => void
  onSave: (status?: TravelPackageStatus) => void
}) {
  const [step, setStep] = useState<EditorStep>("basic")
  const stepIndex = editorSteps.findIndex((item) => item.value === step)
  const update = (field: keyof OwnerTourForm, value: string) => props.setForm((form) => ({ ...form, [field]: value }))
  const selectedTransport = toList(props.form.transportationTypesText)

  function toggleTransport(label: string) {
    const next = selectedTransport.includes(label) ? selectedTransport.filter((item) => item !== label) : [...selectedTransport, label]
    update("transportationTypesText", next.join(", "))
  }

  return (
    <section className="tour-workflow" aria-label="Tour editor workflow">
      <aside className="tour-workflow-steps" aria-label="Tour creation steps">
        {editorSteps.map((item, index) => {
          const Icon = item.icon
          return (
            <button key={item.value} type="button" className={step === item.value ? "active" : ""} onClick={() => setStep(item.value)}>
              <span>{index + 1}</span>
              <div><Icon size={15} />{item.label}</div>
            </button>
          )
        })}
      </aside>
      <div className="tour-workflow-body">
        <div className="tour-workflow-head">
          <div>
            <p>Step {stepIndex + 1} of {editorSteps.length}</p>
            <h3>{editorSteps[stepIndex]?.label}</h3>
          </div>
          <div className="tour-step-controls">
            <button type="button" disabled={stepIndex === 0} onClick={() => setStep(editorSteps[stepIndex - 1].value)}>Previous</button>
            <button type="button" disabled={stepIndex === editorSteps.length - 1} onClick={() => setStep(editorSteps[stepIndex + 1].value)}>Next</button>
          </div>
        </div>

        {step === "basic" ? (
          <div className="tour-form-grid">
            <Field label="Tour title" value={props.form.title} onChange={(value) => update("title", value)} />
            <Field label="Category" value="Tour" readOnly />
            <Field label="Duration" value={props.form.duration} onChange={(value) => update("duration", value)} />
            <Field label="Max participants" value={props.form.maxParticipants} onChange={(value) => update("maxParticipants", value)} />
            <TextArea label="Short summary" value={props.form.shortDescription} onChange={(value) => update("shortDescription", value)} />
          </div>
        ) : null}

        {step === "content" ? (
          <div className="tour-form-grid single">
            <TextArea label="Full description" value={props.form.fullDescription} onChange={(value) => update("fullDescription", value)} rows={7} />
            <TextArea label="Highlights / what travelers will do" value={props.form.itineraryText} onChange={(value) => update("itineraryText", value)} placeholder="Day 1 | Depart from Ulaanbaatar | Arrive and check in" rows={5} />
            <TextArea label="What's included" value={props.form.includedText} onChange={(value) => update("includedText", value)} />
            <TextArea label="What's not included" value={props.form.excludedText} onChange={(value) => update("excludedText", value)} />
          </div>
        ) : null}

        {step === "location" ? (
          <div className="tour-location-grid">
            <div className="tour-form-grid single">
              <Field label="Destination" value={props.form.destination} onChange={(value) => update("destination", value)} />
              <Field label="Start location" value={props.form.startLocation} onChange={(value) => update("startLocation", value)} />
              <Field label="End location" value={props.form.endLocation} onChange={(value) => update("endLocation", value)} />
              <Field label="GPS coordinates" value={props.form.mapCoordinates} onChange={(value) => update("mapCoordinates", value)} placeholder="47.9189, 106.9176" />
            </div>
            <div className="tour-map-picker">
              <MapPin size={28} />
              <strong>Map picker placeholder</strong>
              <span>Interactive map integration is not implemented yet. Coordinates are saved through the real owner tour API.</span>
            </div>
          </div>
        ) : null}

        {step === "transport" ? (
          <div className="tour-admin-stack">
            <div className="transport-selector">
              {transportOptions.map((item) => {
                const Icon = item.icon
                const active = selectedTransport.includes(item.label)
                return (
                  <button key={item.label} type="button" className={active ? "active" : ""} onClick={() => toggleTransport(item.label)}>
                    <Icon size={18} />
                    {item.label}
                  </button>
                )
              })}
            </div>
            <Field label="Selected transportation" value={props.form.transportationTypesText} onChange={(value) => update("transportationTypesText", value)} />
          </div>
        ) : null}

        {step === "itinerary" ? (
          <div className="tour-form-grid single">
            <TextArea label="Day-by-day schedule" value={props.form.itineraryText} onChange={(value) => update("itineraryText", value)} placeholder="Day 1 | Depart from Ulaanbaatar | Arrive at destination&#10;Day 2 | Sightseeing | Meals and activities" rows={10} />
          </div>
        ) : null}

        {step === "pricing" ? (
          <div className="tour-form-grid">
            <Field label="Adult price" value={props.form.price} onChange={(value) => update("price", value)} />
            <Field label="Group price" value={props.form.price} onChange={(value) => update("price", value)} />
            <Field label="Capacity limit" value={props.form.maxParticipants} onChange={(value) => update("maxParticipants", value)} />
            <Field label="Discount support" value="Not configured" readOnly />
          </div>
        ) : null}

        {step === "gallery" ? (
          <div className="tour-gallery-manager">
            <div className="tour-upload-zone">
              <ImageIcon size={28} />
              <strong>Photo upload placeholder</strong>
              <span>Paste one image URL per line. The first image is used as the cover image.</span>
            </div>
            <TextArea label="Gallery images" value={props.form.galleryImagesText} onChange={(value) => update("galleryImagesText", value)} placeholder="One image URL per line" rows={6} />
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="tour-form-grid single">
            <TextArea label="Payment methods and instructions" value={props.form.paymentSettings} onChange={(value) => update("paymentSettings", value)} placeholder="Bank transfer details, QPay placeholder, payment notes" />
            <TextArea label="Cancellation / refund policy" value={props.form.cancellationPolicy} onChange={(value) => update("cancellationPolicy", value)} />
          </div>
        ) : null}

        {step === "review" ? (
          <div className="publish-review">
            <div>
              <p>Review and publish</p>
              <h3>{props.form.title || "Untitled tour"}</h3>
              <span>{props.form.destination || "No destination"} | {formatMoney(toNumber(props.form.price))} | {props.form.status}</span>
            </div>
            {props.form.id ? <Link className="tour-secondary-action" href={`/owner/travel/tours/${props.form.id}/preview`}><Eye size={15} />Preview as customer</Link> : null}
          </div>
        ) : null}

        <div className="tour-editor-actions">
          <button type="button" className="tour-secondary-action" onClick={props.onCancel}>Cancel</button>
          <button type="button" className="tour-secondary-action" disabled={props.saving} onClick={() => props.onSave("draft")}>Save draft</button>
          <button type="button" className="tour-primary-action" disabled={props.saving} onClick={() => props.onSave("published")}>Publish</button>
        </div>
      </div>
    </section>
  )
}

function StatePanel({ title, body }: { title: string; body: string }) {
  return <section className="tour-admin-panel"><div className="tour-panel-head"><h3>{title}</h3></div><p className="tour-empty">{body}</p></section>
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="tour-metric"><span>{label}</span><strong>{value}</strong><p>{detail}</p></div>
}

function Field(props: { label: string; value: string; placeholder?: string; readOnly?: boolean; onChange?: (value: string) => void }) {
  return (
    <label className="tour-field">
      <span>{props.label}</span>
      <input className="admin-input" value={props.value} readOnly={props.readOnly} placeholder={props.placeholder ?? props.label} onChange={(event) => props.onChange?.(event.target.value)} />
    </label>
  )
}

function TextArea(props: { label: string; value: string; placeholder?: string; rows?: number; onChange: (value: string) => void }) {
  return (
    <label className="tour-field">
      <span>{props.label}</span>
      <textarea className="admin-input" rows={props.rows ?? 4} value={props.value} placeholder={props.placeholder ?? props.label} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  )
}

function StatusBadge({ status }: { status: TravelPackageStatus }) {
  return <span className={`tour-status ${status}`}>{status}</span>
}

function formFromTour(tour: StoredTravelPackage): OwnerTourForm {
  return {
    id: tour.id,
    title: tour.title,
    shortDescription: tour.shortDescription,
    fullDescription: tour.fullDescription,
    destination: tour.destination,
    startLocation: tour.startLocation,
    endLocation: tour.endLocation,
    mapCoordinates: tour.mapCoordinates,
    duration: tour.duration,
    transportationTypesText: tour.transportationTypes.join(", "),
    itineraryText: tour.itinerary.map((day) => [day.day, day.title, day.details].filter(Boolean).join(" | ")).join("\n"),
    includedText: tour.included.join("\n"),
    excludedText: tour.excluded.join("\n"),
    price: String(tour.price || tour.adultPrice || ""),
    maxParticipants: String(tour.maxParticipants || ""),
    galleryImagesText: tour.galleryImages.join("\n"),
    paymentSettings: tour.paymentSettings,
    cancellationPolicy: tour.cancellationPolicy,
    status: tour.status,
  }
}

function formToPayload(form: OwnerTourForm) {
  return {
    title: form.title,
    shortDescription: form.shortDescription,
    fullDescription: form.fullDescription,
    destination: form.destination,
    startLocation: form.startLocation,
    endLocation: form.endLocation,
    mapCoordinates: form.mapCoordinates,
    duration: form.duration,
    transportationTypes: toList(form.transportationTypesText),
    itinerary: parseItinerary(form.itineraryText),
    included: toList(form.includedText),
    excluded: toList(form.excludedText),
    price: toNumber(form.price),
    maxParticipants: toNumber(form.maxParticipants),
    galleryImages: toList(form.galleryImagesText),
    paymentSettings: form.paymentSettings,
    cancellationPolicy: form.cancellationPolicy,
    status: form.status,
  }
}

function parseItinerary(value: string): TravelItineraryDay[] {
  return value.split("\n").map((line, index) => {
    const [day, title, details] = line.split("|").map((part) => part.trim())
    return { day: day || `Day ${index + 1}`, date: "", title: title ?? "", details: details ?? "" }
  }).filter((day) => day.title || day.details)
}

function toList(value: string): string[] {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
}

function toNumber(value: string): number {
  return Number(value.replace(/[^\d]/g, "")) || 0
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} MNT`
}

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString("mn-MN") : "-"
}
