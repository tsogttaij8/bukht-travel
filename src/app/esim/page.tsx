import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Image from "next/image"

const plans = [
  { name: "Starter 3GB / 7 хоног", price: "19,900 MNT", note: "China data only", badge: "Хөнгөн хэрэглээ" },
  { name: "Pro 10GB / 15 хоног", price: "49,900 MNT", note: "China + hotspot", badge: "Хамгийн их сонголт" },
  { name: "Business 20GB / 30 хоног", price: "89,900 MNT", note: "Priority network", badge: "Бизнес аялал" },
]

const steps = [
  "Багцаа сонгоно",
  "Төлбөр хийнэ",
  "QR кодоо имэйлээр авна",
  "Утсандаа суулгаад датагаа асаана",
]

const perks = [
  "2-3 минутын дотор идэвхжинэ",
  "Физик сим солих шаардлагагүй",
  "China travel-д зориулсан шууд дата",
]

export default function EsimPage() {
  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <section className="esim-hero">
            <div className="esim-hero-copy">
              <span className="esim-eyebrow">Travel Connected</span>
              <h1 className="section-title" style={{ marginBottom: 16 }}>eSIM Дата багц</h1>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>
                Хятад аялалд зориулсан eSIM багцууд. QR кодоор 2-3 минутанд идэвхжүүлээд,
                буусан даруйдаа датагаа шууд ашиглана.
              </p>

              <div className="esim-perk-list">
                {perks.map((perk) => (
                  <span key={perk}>{perk}</span>
                ))}
              </div>
            </div>

            <div className="esim-hero-panel">
              <div className="esim-signal-card">
                <p>Активаци</p>
                <strong>2-3 мин</strong>
              </div>
              <div className="esim-signal-card">
                <p>Device</p>
                <strong>eSIM Ready</strong>
              </div>
              <div className="esim-hero-chip">QR delivery via email</div>
              <div className="esim-hero-chip">Hotspot support on Pro</div>
            </div>
          </section>

          <section className="esim-plan-grid">
            {plans.map((plan) => (
              <article key={plan.name} className="esim-plan-card">
                <span className="esim-plan-badge">{plan.badge}</span>
                <h3>{plan.name}</h3>
                <div className="esim-plan-price">{plan.price}</div>
                <p>{plan.note}</p>
              </article>
            ))}
          </section>

          <section className="esim-bottom-grid">
            <article className="esim-flow-card">
              <h3>Идэвхжүүлэх алхам</h3>
              <div className="esim-step-list">
                {steps.map((step, index) => (
                  <div key={step} className="esim-step-item">
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="esim-payment-card">
              <div>
                <h3 style={{ marginBottom: 10 }}>Khan Bank QR төлбөр</h3>
                <p style={{ marginBottom: 8 }}>Хүлээн авагч: <strong>BUKHT LLC</strong></p>
                <p style={{ marginBottom: 8 }}>Банк: <strong>Khan Bank</strong></p>
                <p style={{ marginBottom: 8 }}>Данс: <strong>5023456789</strong></p>
                <p style={{ marginBottom: 0 }}>Гүйлгээний утга: <strong>Нэр + Утас + eSIM</strong></p>
              </div>

              <div className="esim-qr-shell">
                <Image
                  src="/khanbank-qr-placeholder.svg"
                  alt="Khan Bank QR"
                  width={280}
                  height={280}
                  style={{ width: "100%", maxWidth: 260, height: "auto" }}
                />
              </div>
            </article>
          </section>

          <p style={{ marginTop: 12, color: "#5a5349" }}>
            Жинхэнэ QR зураг оруулах бол `public/khanbank-qr.png` файл хийж, дээрх `src`-ийг солиход болно.
          </p>
        </div>
      </main>

      <Footer />
    </>
  )
}
