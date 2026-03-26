import Navbar from "../../components/Navbar"
import CargoTracker from "../../components/CargoTrecker"
import Footer from "../../components/Footer"

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

export default function CargoPage() {
  return (
    <>
      <Navbar />

      <div className="container">
        <section className="section">
          <div className="cargo-hero">
            <div className="cargo-hero-copy">
              <span className="cargo-eyebrow">BUHKT Cargo Flow</span>
              <h1 className="section-title" style={{ marginBottom: 16 }}>Карго / Тээвэр</h1>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>
                Хятадаас таталт, нэгтгэл, ачилт, хүргэлтийн процессыг ил тод tracking-тайгаар хянаж,
                тогтмол урсгалаар Монголд хүргэнэ.
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

          <div className="cargo-step-grid">
            {cargoSteps.map((step, index) => (
              <article key={step.title} className="cargo-step-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>

          <div className="cargo-tracker-shell">
            <CargoTracker />
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
