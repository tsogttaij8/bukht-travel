import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"

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
        <div className="container">
          <section className="travel-hero">
            <div className="travel-hero-copy">
              <span className="travel-eyebrow">Trade Journey Design</span>
              <h1 className="section-title" style={{ marginBottom: 16 }}>Худалдааны аяллаа хотоор нь төлөвлө</h1>
              <p className="section-subtitle" style={{ marginBottom: 24 }}>
                Хятад руу явах аяллыг зүгээр ticket booking биш, харин supplier уулзалт, орчуулагч, route planning, cargo follow-up-тай нь хамт зохион байгуулна.
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
        </div>
      </main>
      <Footer/>
    </>
  )
}
