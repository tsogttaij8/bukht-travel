import { cookies } from "next/headers"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Link from "next/link"
import { listProducts, type StoredProduct } from "../../lib/server/product-store"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

export const dynamic = "force-dynamic"

const categoryHighlights = ["Гэр ахуй", "Гоо сайхан", "Хувцас", "Электроник"]

const serviceSteps = [
  { title: "Бараа сонгох", text: "Шүүлтүүр нэмэхэд бэлэн каталогоос үнэ, MOQ, ангиллаа харж сонгоно." },
  { title: "Нийлүүлэлт баталгаажуулах", text: "Dashboard-оос шинэ бараа нэмж санал болгох урсгалтай." },
  { title: "Карготой холбох", text: "Сонгосон бараагаа цааш shipment flow-той уяж өргөжүүлж болно." },
]

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

export default async function ShopPage(){
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = token ? verifySessionToken(token) : null

  let products: StoredProduct[] = []
  let loadError = ""

  try {
    products = await listProducts()
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Барааны мэдээлэл уншихад алдаа гарлаа."
    console.error("Failed to load shop products", error)
  }

  return(
    <>
      <Navbar/>
      <main className="section shop-page">
        <div className="container shop-page-shell">
          <section className="shop-hero">
            <div className="shop-hero-copy">
              <span className="section-kicker">Marketplace</span>
              <span className="shop-eyebrow">Marketplace Commerce</span>
              <h1 className="section-title" style={{ marginBottom: 16 }}>Цэвэрхэн, илүү худалдааны мэдрэмжтэй shop</h1>
              <p className="section-subtitle" style={{ marginBottom: 24 }}>
                Marketplace төрлийн цэгцтэй худалдааны хэсэг. Барааны гол үзүүлэлтүүд нэг дор харагдаж, хүн бүр эхлээд чөлөөтэй үзэж танилцаад, хүсэлт өгөх үедээ л account-аараа үргэлжлүүлнэ.
              </p>
              <div className="shop-chip-row">
                {categoryHighlights.map((item) => (
                  <span key={item} className="shop-chip">{item}</span>
                ))}
              </div>
            </div>

            <div className="shop-hero-panel">
              <div className="shop-stat-card">
                <strong>{products.length}</strong>
                <span>Идэвхтэй бараа</span>
              </div>
              <div className="shop-stat-card">
                <strong>MOQ</strong>
                <span>Бөөний болон reseller худалдан авалтад чиглэсэн</span>
              </div>
              <div className="shop-stat-card">
                <strong>Удирдлага</strong>
                <span>Хөгжүүлэгчийн хэсгээс бараа шууд нэмэх боломжтой</span>
              </div>
            </div>
          </section>

          <section className="shop-section-block shop-section-shell">
            <div className="shop-section-head">
              <div>
                <span className="section-kicker">Catalog</span>
                <h2 className="section-title" style={{ marginBottom: 10 }}>Онцлох бараанууд</h2>
                <p className="section-subtitle">Shop хэсгийн картууд одоо өгөгдлөөс уншигдаж байгаа тул шинэ бараа нэмэхэд шууд энд харагдана.</p>
                <p className="section-subtitle" style={{ marginTop: 10 }}>
                  Сонирхсон бараагаа сонгоод дараагийн алхам руу ороход л нэвтрэх шаардлагатай. Хүсэлт, sourcing flow нь хэрэглэгчийн өөрийн account дээр хадгалагдана.
                </p>
                {loadError ? <p className="section-subtitle" style={{ marginTop: 10, color: "#b42318" }}>{loadError}</p> : null}
              </div>
              <div className="shop-muted-box">Бараа нэмэх хэсэг: `/developer`</div>
            </div>

            <div className="shop-product-grid">
              {products.map((item) => (
                <article key={item.id} className="shop-product-card">
                  <div className="shop-product-cover">
                    <span>{initials(item.name)}</span>
                  </div>
                  <div className="shop-product-topline">
                    <span className="shop-product-category">{item.category}</span>
                    <span className="shop-product-badge">{item.badge}</span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.summary}</p>
                  <div className="shop-product-meta">
                    <strong>{item.price}</strong>
                    <span>{item.moq}</span>
                    <span>{item.origin}</span>
                    <span>{item.leadTime}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    {(() => {
                      const accountPath = `/account?service=product_sourcing&title=${encodeURIComponent(item.name)}`
                      const requestPath = session ? accountPath : `/login?next=${encodeURIComponent(accountPath)}`

                      return (
                        <Link
                          href={requestPath}
                          className="btn btn-primary"
                          style={{ padding: "10px 14px", fontSize: "0.92rem" }}
                        >
                          {session ? "Хүсэлт өгөх" : "Сонгоод нэвтрэх"}
                        </Link>
                      )
                    })()}
                    <Link
                      href={`/cargo`}
                      className="btn btn-secondary"
                      style={{ padding: "10px 14px", fontSize: "0.92rem" }}
                    >
                      Карготой холбох
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="shop-bottom-grid shop-section-shell">
            <article className="shop-info-panel">
              <span className="section-kicker">Flow</span>
              <h2 className="section-title" style={{ marginBottom: 12 }}>Яаж ажиллах вэ</h2>
              <div className="shop-steps">
                {serviceSteps.map((step, index) => (
                  <div key={step.title} className="shop-step">
                    <span>{index + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="shop-info-panel shop-info-panel-warm">
              <span className="section-kicker">Benefits</span>
              <h2 className="section-title" style={{ marginBottom: 12 }}>Яагаад илүү дээр болсон бэ</h2>
              <div className="shop-benefits">
                <div>
                  <strong>Clean listing</strong>
                  <p>Үнэ, MOQ, гарал үүсэл, хүрэх хугацаа нэг дор харагдана.</p>
                </div>
                <div>
                  <strong>Easy admin flow</strong>
                  <p>Developer dashboard-оос шууд бараа нэмэхээр код өөрчлөх шаардлагагүй боллоо.</p>
                </div>
                <div>
                  <strong>Scale-ready</strong>
                  <p>Дараагийн алхамд зураг, filter, search, supplier detail нэмэхэд бэлэн суурьтай.</p>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
      <Footer/>
    </>
  )
}
