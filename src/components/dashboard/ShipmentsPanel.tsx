import type { ShipmentStatus } from "../../lib/server/shipment-store"
import { labelForStatus, shipmentStatuses } from "./constants"
import type { DashboardShipment, ShipmentForm, ShipmentUpdateState } from "./types"

type ShipmentsPanelProps = {
  shipments: DashboardShipment[]
  form: ShipmentForm
  error: string
  busy: boolean
  updateState: ShipmentUpdateState
  setForm: (updater: (form: ShipmentForm) => ShipmentForm) => void
  setUpdateState: (updater: (state: ShipmentUpdateState) => ShipmentUpdateState) => void
  createShipment: () => void
  loadShipmentEvents: (shipment: DashboardShipment) => void
  addEvent: (shipment: DashboardShipment) => void
}

export function ShipmentCreatePanel(props: ShipmentsPanelProps) {
  return (
    <section className="office-panel developer-panel">
      <h3 style={{ marginBottom: 16 }}>Шинэ shipment үүсгэх</h3>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Input field="trackingCode" placeholder="Tracking код" {...props} />
        <Input field="customerName" placeholder="Хэрэглэгчийн нэр" {...props} />
        <Input field="customerEmail" placeholder="Имэйл" {...props} />
        <Input field="origin" placeholder="Эхлэх цэг" {...props} />
        <Input field="destination" placeholder="Очих цэг" {...props} />
        <select value={props.form.currentStatus} onChange={(event) => props.setForm((state) => ({ ...state, currentStatus: event.target.value as ShipmentStatus }))} className="admin-input">
          {shipmentStatuses.map((status) => <option key={status} value={status}>{labelForStatus(status)}</option>)}
        </select>
      </div>
      <textarea value={props.form.notes} onChange={(event) => props.setForm((state) => ({ ...state, notes: event.target.value }))} placeholder="Тэмдэглэл" className="admin-input" style={{ width: "100%", minHeight: 88, marginTop: 12, resize: "vertical" }} />
      {props.error ? <p style={{ margin: "12px 0 0", color: "#b42318", fontWeight: 700 }}>{props.error}</p> : null}
      <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={props.createShipment} disabled={props.busy}>
        {props.busy ? "Үүсгэж байна..." : "Shipment үүсгэх"}
      </button>
    </section>
  )
}

export function ShipmentListPanel(props: ShipmentsPanelProps) {
  return (
    <section className="office-panel developer-panel">
      <h3 style={{ marginBottom: 16 }}>Shipment удирдлага</h3>
      <div style={{ display: "grid", gap: 16 }}>{props.shipments.map((shipment) => <ShipmentCard key={shipment.id} shipment={shipment} {...props} />)}</div>
    </section>
  )
}

function ShipmentCard(props: ShipmentsPanelProps & { shipment: DashboardShipment }) {
  const current = props.updateState[props.shipment.trackingCode] ?? { status: props.shipment.currentStatus, details: "", location: "", busy: false, error: "" }
  const update = (patch: Partial<typeof current>) => props.setUpdateState((state) => ({ ...state, [props.shipment.trackingCode]: { ...current, ...patch } }))

  return (
    <article className="office-row developer-item-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div><strong>{props.shipment.trackingCode}</strong><p style={{ margin: "6px 0 0" }}>{props.shipment.customerName} - {props.shipment.origin} -&gt; {props.shipment.destination}</p></div>
        <span style={{ fontWeight: 700, color: "#8a5a3c" }}>{labelForStatus(props.shipment.currentStatus)}</span>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <select value={current.status} onChange={(event) => update({ status: event.target.value as ShipmentStatus })} className="admin-input">
          {shipmentStatuses.map((status) => <option key={status} value={status}>{labelForStatus(status)}</option>)}
        </select>
        <input value={current.location} onChange={(event) => update({ location: event.target.value })} placeholder="Байршил" className="admin-input" />
        <input value={current.details} onChange={(event) => update({ details: event.target.value })} placeholder="Төлөвийн тайлбар" className="admin-input" />
      </div>
      {current.error ? <p style={{ margin: "10px 0 0", color: "#b42318", fontWeight: 700 }}>{current.error}</p> : null}
      <button className="btn btn-secondary" type="button" style={{ marginTop: 12 }} onClick={() => props.addEvent(props.shipment)} disabled={current.busy}>{current.busy ? "Шинэчилж байна..." : "Төлөв шинэчлэх"}</button>
      <button className="btn btn-secondary" type="button" style={{ marginTop: 12, marginLeft: 10 }} onClick={() => props.loadShipmentEvents(props.shipment)} disabled={current.busy || props.shipment.eventsLoaded}>{props.shipment.eventsLoaded ? "Түүх ачаалсан" : "Түүх ачаалах"}</button>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>{props.shipment.eventsLoaded ? props.shipment.events.map((event) => <div key={event.id} style={{ borderLeft: "3px solid #d8b98a", paddingLeft: 12 }}><strong>{labelForStatus(event.status)}</strong><p style={{ margin: "4px 0" }}>{event.details}</p></div>) : null}</div>
    </article>
  )
}

function Input(props: ShipmentsPanelProps & { field: keyof ShipmentForm; placeholder: string }) {
  return <input value={props.form[props.field]} onChange={(event) => props.setForm((state) => ({ ...state, [props.field]: event.target.value }))} placeholder={props.placeholder} className="admin-input" />
}
