import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import Navbar from "../../components/Navbar"
import CargoTracker from "../../components/CargoTrecker"
import Footer from "../../components/Footer"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

const cargoHighlights = [
  "1 кг ачаа 3000 төгрөг",
  "Хятадаас Монгол руу тогтмол таталт",
  "Tracking кодоор явцаа шууд шалгана",
]

const cargoSteps = [
  {
    title: "Хаяг бүртгэх",
    text: "Захиалгын мэдээллээ өгөөд агуулахын хаяг, хүлээн авагчийн мэдээллээ баталгаажуулна.",
  },
  {
    title: "Ачилт нэгтгэх",
    text: "Олон захиалгыг нэгтгэж, шалгалт хийгээд тээврийн урсгалд оруулна.",
  },
  {
    title: "Улаанбаатарт хүргэх",
    text: "Ирсэн даруйд tracking төлөв шинэчлэгдэж, авах эсвэл хүргэлтээр холбогдоно.",
  },
]

export default async function CargoPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value

  if (!token || !verifySessionToken(token)) {
    redirect(`/login?next=${encodeURIComponent("/cargo")}`)
  }

  return (
    <>
      <Navbar />

      <div className="container">
        <section className="section cargo-page-shell">
          <div className="cargo-hero">
            <div className="cargo-hero-copy">
              <span className="section-kicker">Cargo network</span>
              <span className="cargo-eyebrow">BUHKT Cargo Flow</span>
              <h1 className="section-title" style={{ marginBottom: 16 }}>Карго / Тээвэр</h1>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>
                Хятадаас таталт, нэгтгэл, ачилт, хүргэлтийн процессыг ил тод tracking-тайгаар хянаж,
                тогтмол урсгалаар Монголд хүргэнэ. Энэ хэсэгт нэвтэрсэн хэрэглэгч өөрийн cargo мэдээлэл, хүсэлтээ account-тайгаа холбож ашиглана.
              </p>

              <div className="cargo-highlight-list">
                {cargoHighlights.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>

            <div className="cargo-price-card">
              <p className="cargo-price-label">Стандарт тариф</p>
              <div className="cargo-price-row">
                <strong>3000₮</strong>
                <span>/ 1 кг</span>
              </div>
              <p className="cargo-price-note">
                Жижиг ачаа, онлайн захиалга, supplier-ээс агуулах хүртэлх урсгалд тохирсон энгийн, ойлгомжтой үнэ.
              </p>

              <div className="cargo-metrics">
                <div>
                  <strong>48-96 цаг</strong>
                  <span>ачилтын цикл</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>tracking update</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cargo-page-section">
            <span className="section-kicker">Shipment flow</span>
            <div className="cargo-step-grid">
              {cargoSteps.map((step, index) => (
                <article key={step.title} className="cargo-step-card">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="cargo-tracker-shell cargo-page-section">
            <span className="section-kicker">Live tracking</span>
            <CargoTracker />
          </div>

          <section className="card page-cta-shell" style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Карго хүсэлтээ өөрийн account-аас удирдах</h3>
            <p style={{ margin: 0, color: "#5a5349" }}>
              Хэрэглэгч бүр өөрийн имэйлээр account үүсгээд cargo хүсэлт, shipment-тэй холбоотой follow-up, бараа, аяллын урсгалаа тусдаа хадгалж удирдана.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/account?service=cargo&title=%D0%9A%D0%B0%D1%80%D0%B3%D0%BE%20%D1%85%D2%AF%D1%81%D1%8D%D0%BB%D1%82" className="btn btn-primary">Account-аараа cargo хүсэлт өгөх</Link>
              <Link href="/login" className="btn btn-secondary">Имэйлээр нэвтрэх</Link>
            </div>
          </section>
        </section>
      </div>

      <Footer />
    </>
  )
}
