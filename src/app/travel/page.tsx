import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Link from "next/link"

const cityHighlights = [
  {
    name: "Guangzhou",
    label: "Canton Fair & factory route",
    description: "Үйлдвэр, бөөний төв, export supplier уулзалтыг нэг маршрутад багтаахад хамгийн тохиромжтой хот.",
    focus: ["Factory visit", "Canton Fair", "Supplier shortlist"],
    className: "travel-city-visual-guangzhou",
  },
  {
    name: "Yiwu",
    label: "Small commodity capital",
    description: "Жижиг оврын бараа, gift shop, reseller ангиллын хамгийн хурдан sourcing цэг.",
    focus: ["Futian Market", "Low MOQ", "Fast sampling"],
    className: "travel-city-visual-yiwu",
  },
  {
    name: "Shenzhen",
    label: "Electronics & gadgets",
    description: "Электроник, аксессуар, OEM/ODM ярилцлага хийхэд илүү хүчтэй хот.",
    focus: ["Electronics", "OEM/ODM", "Tech sourcing"],
    className: "travel-city-visual-shenzhen",
  },
]

const travelSteps = [
  {
    title: "Brief авах",
    text: "Та ямар төрлийн бараа хайж байгаагаа, хэдэн хоногийн аялал хүсэж байгаагаа өгнө.",
  },
  {
    title: "Хот ба маршрут сонгох",
    text: "Бид Иү, Гуанжоу, Шэньжэнь зэрэг хотуудаас таны бизнесийн зорилгод таарах чиглэлийг гаргана.",
  },
  {
    title: "Уулзалт товлох",
    text: "Supplier shortlist, орчуулагч, тээвэр, зочид буудлыг урьдчилж зохион байгуулна.",
  },
  {
    title: "Аялал дээр support хийх",
    text: "Очсон газар дээр чинь хэлцэл, бараа шалгалт, карго холболтыг дэмжинэ.",
  },
]

export default function TravelPage(){
  return(
    <>
      <Navbar/>
      <main className="section travel-page">
        <div className="container travel-page-shell">
          <section className="travel-hero">
            <div className="travel-hero-copy">
              <span className="section-kicker">Travel design</span>
              <span className="travel-eyebrow">Trade Journey Design</span>
              <h1 className="section-title" style={{ marginBottom: 16 }}>Худалдааны аяллаа хотоор нь төлөвлө</h1>
              <p className="section-subtitle" style={{ marginBottom: 24 }}>
                Хятад руу явах аяллыг зүгээр ticket booking биш, харин supplier уулзалт, орчуулагч, route planning, cargo follow-up-тай нь хамт зохион байгуулна. Үзэхэд нээлттэй, харин хүсэлт үлдээхдээ имэйл account ашиглана.
              </p>
              <div className="travel-pill-row">
                <span className="travel-pill">Иү market route</span>
                <span className="travel-pill">Factory visit agenda</span>
                <span className="travel-pill">Interpreter support</span>
                <span className="travel-pill">Cargo handoff</span>
              </div>
            </div>

            <div className="travel-hero-visual">
              <div className="travel-hero-photo">
                <div className="travel-hero-stamp">China sourcing trip</div>
              </div>
              <div className="travel-hero-metrics">
                <div className="travel-metric-card">
                  <strong>3+</strong>
                  <span>гол хотын маршрут</span>
                </div>
                <div className="travel-metric-card">
                  <strong>1:1</strong>
                  <span>орчуулагч ба planning support</span>
                </div>
                <div className="travel-metric-card">
                  <strong>Cargo</strong>
                  <span>аяллаас шууд карготой холбодог</span>
                </div>
              </div>
            </div>
          </section>

          <section className="travel-section-block">
            <div className="travel-section-head">
              <div>
                <span className="section-kicker">City routes</span>
                <h2 className="section-title" style={{ marginBottom: 10 }}>Хотуудаар нь сонгох</h2>
                <p className="section-subtitle">Ямар бараа хайж байгаагаас шалтгаалаад таны аяллын хот өөр байх ёстой. Гол чиглэлүүдийг эндээс харж болно.</p>
              </div>
              <div className="travel-muted-box">Custom маршрут боломжтой</div>
            </div>

            <div className="travel-city-grid">
              {cityHighlights.map((city) => (
                <article key={city.name} className="travel-city-card">
                  <div className={`travel-city-visual ${city.className}`}>
                    <span>{city.label}</span>
                  </div>
                  <div className="travel-city-copy">
                    <div className="travel-city-topline">
                      <h3>{city.name}</h3>
                      <span>Featured city</span>
                    </div>
                    <p>{city.description}</p>
                    <div className="travel-city-tags">
                      {city.focus.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="travel-split-grid">
            <article className="travel-info-card">
              <span className="section-kicker">Flow</span>
              <h2 className="section-title" style={{ marginBottom: 12 }}>Аяллын урсгал</h2>
              <div className="travel-step-list">
                {travelSteps.map((step, index) => (
                  <div key={step.title} className="travel-step-item">
                    <span>{index + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="travel-info-card travel-info-card-accent">
              <span className="section-kicker">Included</span>
              <h2 className="section-title" style={{ marginBottom: 12 }}>Аялал дээр яг юу ордог вэ</h2>
              <div className="travel-benefit-list">
                <div>
                  <strong>Route planning</strong>
                  <p>Хот, market, factory, meeting бүрийг өдрөөр нь төлөвлөж өгнө.</p>
                </div>
                <div>
                  <strong>Local support</strong>
                  <p>Орчуулга, supplier talk, negotiation үед газар дээр нь support үзүүлнэ.</p>
                </div>
                <div>
                  <strong>Commerce follow-up</strong>
                  <p>Захиалга баталгаажсны дараа eSIM, cargo, sourcing flow руу шууд холбоно.</p>
                </div>
              </div>
            </article>
          </section>

          <section className="card page-cta-shell" style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Аялал, бараа, карго-г нэг account дээрээ холбох</h3>
            <p style={{ margin: 0, color: "#5a5349" }}>
              Аяллын мэдээллийг хүн бүр чөлөөтэй үзэж болно. Харин маршрут, supplier, cargo, eSIM-тэй холбоотой нарийн хүсэлтүүд нь тухайн хэрэглэгчийн имэйл account дээр хадгалагдана.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/account?service=travel&title=%D0%A5%D1%8F%D1%82%D0%B0%D0%B4%20%D0%B0%D1%8F%D0%BB%D0%BB%D1%8B%D0%BD%20%D1%82%D3%A9%D0%BB%D3%A9%D0%B2%D0%BB%D3%A9%D0%BB%D1%82" className="btn btn-primary">Account-аараа аяллын хүсэлт өгөх</Link>
              <Link href="/shop" className="btn btn-secondary">Shop руу орох</Link>
            </div>
          </section>
        </div>
      </main>
      <Footer/>
    </>
  )
}
