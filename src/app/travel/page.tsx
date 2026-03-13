import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"

export default function TravelPage(){
  return(
    <>
      <Navbar/>
      <main className="section">
        <div className="container">
          <h1 className="section-title">Аялал (Travel)</h1>
          <p className="section-subtitle" style={{marginBottom:24}}>
            Хятад руу худалдааны аяллыг хот, маршрут, орчуулагч, уулзалтын хөтөлбөртэйгээр цогцоор нь зохион байгуулна.
          </p>

          <div className="card-grid">
            <article className="card" style={{gridColumn:"span 4"}}>
              <h3>Маршрут</h3>
              <p>Иү, Гуанжоу болон худалдааны гол бүсүүд рүү уян хатан төлөвлөгөө.</p>
            </article>
            <article className="card" style={{gridColumn:"span 4"}}>
              <h3>Орчуулга</h3>
              <p>Хэлний саадгүй, хэлцэлд төвлөрсөн бодит дэмжлэг.</p>
            </article>
            <article className="card" style={{gridColumn:"span 4"}}>
              <h3>Зохион байгуулалт</h3>
              <p>Тээвэр, зочид буудал, уулзалт нэг цэгийн менежмент.</p>
            </article>
          </div>
        </div>
      </main>
      <Footer/>
    </>
  )
}
