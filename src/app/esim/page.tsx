import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Image from "next/image"
import Link from "next/link"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

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

export default async function EsimPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value

  if (!token || !verifySessionToken(token)) {
    redirect(`/login?next=${encodeURIComponent("/esim")}`)
  }

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container esim-page-shell">
          <section className="esim-hero">
            <div className="esim-hero-copy">
              <span className="section-kicker">Connected travel</span>
              <span className="esim-eyebrow">Travel Connected</span>
              <h1 className="section-title" style={{ marginBottom: 16 }}>eSIM Дата багц</h1>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>
                Хятад аялалд зориулсан eSIM багцууд. QR кодоор 2-3 минутанд идэвхжүүлээд,
                буусан даруйдаа датагаа шууд ашиглана. Захиалга, түүх, дараагийн хүсэлтүүд нь таны имэйл account дээр хадгалагдана.
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

          <section className="esim-page-section">
            <span className="section-kicker">Plans</span>
            <div className="esim-plan-grid">
            {plans.map((plan) => (
              <article key={plan.name} className="esim-plan-card">
                <span className="esim-plan-badge">{plan.badge}</span>
                <h3>{plan.name}</h3>
                <div className="esim-plan-price">{plan.price}</div>
                <p>{plan.note}</p>
              </article>
            ))}
            </div>
          </section>

          <section className="esim-bottom-grid">
            <article className="esim-flow-card">
              <span className="section-kicker">Activation</span>
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
                <span className="section-kicker">Payment</span>
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

          <section className="card page-cta-shell" style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0 }}>eSIM-ээ account-аараа захиалах</h3>
            <p style={{ margin: 0, color: "#5a5349" }}>
              Имэйлээр account үүсгээд өөрийн нэр дээр eSIM хүсэлт илгээвэл дараа нь аялал, карго, барааны хүсэлттэйгээ хамт тухайн хэрэглэгчийн account дээр нэг дор харагдана.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/account?service=esim&title=eSIM%20%D0%B4%D0%B0%D1%82%D0%B0%20%D0%B1%D0%B0%D0%B3%D1%86" className="btn btn-primary">Account-аараа eSIM авах</Link>
              <Link href="/login" className="btn btn-secondary">Имэйлээр бүртгүүлэх</Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
