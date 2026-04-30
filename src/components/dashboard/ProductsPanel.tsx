import type { StoredProduct } from "../../lib/server/product-store"
import type { ProductForm } from "./types"

type ProductsPanelProps = {
  products: StoredProduct[]
  form: ProductForm
  error: string
  busy: boolean
  setForm: (updater: (form: ProductForm) => ProductForm) => void
  createProduct: () => void
}

export function ProductCreatePanel(props: ProductsPanelProps) {
  return (
    <section className="card developer-panel">
      <h3 style={{ marginBottom: 16 }}>Shop-д бараа нэмэх</h3>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Input field="name" placeholder="Барааны нэр" {...props} />
        <Input field="category" placeholder="Ангилал" {...props} />
        <Input field="price" placeholder="Үнэ" {...props} />
        <Input field="moq" placeholder="MOQ" {...props} />
        <Input field="origin" placeholder="Гарал" {...props} />
        <Input field="leadTime" placeholder="Хүрэх хугацаа" {...props} />
        <Input field="badge" placeholder="Шошго" {...props} />
      </div>
      <textarea value={props.form.summary} onChange={(event) => props.setForm((state) => ({ ...state, summary: event.target.value }))} placeholder="Товч тайлбар" className="admin-input" style={{ width: "100%", minHeight: 88, marginTop: 12, resize: "vertical" }} />
      {props.error ? <p style={{ margin: "12px 0 0", color: "#b42318", fontWeight: 700 }}>{props.error}</p> : null}
      <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={props.createProduct} disabled={props.busy}>
        {props.busy ? "Нэмж байна..." : "Бараа нэмэх"}
      </button>
    </section>
  )
}

export function ProductListPanel({ products }: { products: StoredProduct[] }) {
  return (
    <section className="card developer-panel">
      <h3 style={{ marginBottom: 16 }}>Shop барааны жагсаалт</h3>
      <div style={{ display: "grid", gap: 14 }}>
        {products.map((product) => (
          <article key={product.id} className="developer-item-card" style={{ border: "1px solid #e5ddcf", borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><strong>{product.name}</strong><p style={{ margin: "6px 0 0" }}>{product.category} - {product.origin}</p></div>
              <span style={{ fontWeight: 700, color: "#8a5a3c" }}>{product.badge}</span>
            </div>
            <p style={{ margin: "10px 0 0" }}>{product.summary}</p>
            <p style={{ margin: "10px 0 0", color: "#6b5b4c" }}>{product.price} - {product.moq} - {product.leadTime}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Input(props: ProductsPanelProps & { field: keyof ProductForm; placeholder: string }) {
  return (
    <input
      value={props.form[props.field]}
      onChange={(event) => props.setForm((state) => ({ ...state, [props.field]: event.target.value }))}
      placeholder={props.placeholder}
      className="admin-input"
    />
  )
}

