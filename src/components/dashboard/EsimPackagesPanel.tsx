import type { StoredEsimPackage } from "../../lib/server/esim-package-store"
import type { EsimPackageForm } from "./types"

type EsimPackagesPanelProps = {
  esimPackages: StoredEsimPackage[]
  form: EsimPackageForm
  error: string
  busy: boolean
  setForm: (updater: (form: EsimPackageForm) => EsimPackageForm) => void
  createEsimPackage: () => void
}

export function EsimPackageCreatePanel(props: EsimPackagesPanelProps) {
  return (
    <section className="office-panel developer-panel">
      <h3 style={{ marginBottom: 16 }}>eSIM нэмэх</h3>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Input field="name" placeholder="Багцын нэр" {...props} />
        <Input field="dataAmount" placeholder="Дата хэмжээ" {...props} />
        <Input field="validity" placeholder="Хүчинтэй хоног" {...props} />
        <Input field="price" placeholder="Үнэ" {...props} />
        <Input field="badge" placeholder="Шошго" {...props} />
      </div>
      <textarea value={props.form.note} onChange={(event) => props.setForm((state) => ({ ...state, note: event.target.value }))} className="admin-input" placeholder="Товч тайлбар" style={{ width: "100%", minHeight: 88, marginTop: 12, resize: "vertical" }} />
      {props.error ? <p style={{ margin: "12px 0 0", color: "#b42318", fontWeight: 700 }}>{props.error}</p> : null}
      <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={props.createEsimPackage} disabled={props.busy}>
        {props.busy ? "Хадгалж байна..." : "eSIM хадгалах"}
      </button>
    </section>
  )
}

export function EsimPackageListPanel({ esimPackages }: { esimPackages: StoredEsimPackage[] }) {
  return (
    <section className="office-panel developer-panel">
      <h3 style={{ marginBottom: 16 }}>eSIM багцууд</h3>
      <div style={{ display: "grid", gap: 14 }}>
        {esimPackages.map((item) => (
          <article key={item.id} className="office-row developer-item-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><strong>{item.name}</strong><p style={{ margin: "6px 0 0" }}>{item.dataAmount} - {item.validity}</p></div>
              <span style={{ fontWeight: 700, color: "#172033" }}>{item.price}</span>
            </div>
            <p style={{ margin: "10px 0 0", color: "#516071" }}>{item.note}</p>
          </article>
        ))}
        {esimPackages.length === 0 ? <p style={{ margin: 0, color: "#6b5b4c" }}>Одоогоор eSIM багц нэмээгүй байна.</p> : null}
      </div>
    </section>
  )
}

function Input(props: EsimPackagesPanelProps & { field: keyof EsimPackageForm; placeholder: string }) {
  return <input value={props.form[props.field]} onChange={(event) => props.setForm((state) => ({ ...state, [props.field]: event.target.value }))} placeholder={props.placeholder} className="admin-input" />
}
