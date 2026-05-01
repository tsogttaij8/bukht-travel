import Link from "next/link"
import { notFound } from "next/navigation"
import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import TravelBookingPanel from "../../../components/TravelBookingPanel"
import { getTravelPackage } from "../../../lib/server/travel-package-store"

type TravelDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function TravelDetailPage({ params }: TravelDetailPageProps) {
  const { id } = await params
  const travelPackage = await getTravelPackage(id)
  if (!travelPackage) notFound()

  const gallery = [travelPackage.heroImage, ...travelPackage.galleryImages].slice(0, 4)

  return (
    <>
      <Navbar />
      <main className="travel-detail-page">
        <div className="travel-detail-shell">
          <div className="travel-detail-main">
            <section className="travel-gallery-grid">
              {gallery.map((image, index) => (
                <div key={`${image}-${index}`} className="travel-gallery-image" style={{ backgroundImage: `url(${image})` }} />
              ))}
            </section>

            <div className="travel-title-row">
              <div>
                <h1>{travelPackage.title}</h1>
                <p>⌖ {travelPackage.location}</p>
              </div>
              <div className="travel-share-row">
                <Link href="/" className="travel-small-button">Нүүр</Link>
                <Link href="/travel" className="travel-small-button">Аялал</Link>
              </div>
            </div>

            <nav className="travel-tabs">
              <a href="#intro">Танилцуулга</a>
              <a href="#program">Хөтөлбөр</a>
              <a href="#included">Багтсан зүйлс</a>
              <a href="#warning">Анхааруулга</a>
            </nav>

            <section id="intro" className="travel-detail-card">
              <h2>Компанийн танилцуулга</h2>
              <p>{travelPackage.summary}</p>
            </section>

            <section id="program" className="travel-detail-card">
              <h2>Аяллын хөтөлбөр</h2>
              <div className="travel-itinerary-list">
                {travelPackage.itinerary.map((day, index) => (
                  <article key={`${day.day}-${index}`} className="travel-itinerary-item">
                    <div className="travel-itinerary-date">
                      <strong>{day.day || `Өдөр-${index + 1}`}</strong>
                      {day.date ? <span>{day.date}</span> : null}
                    </div>
                    <div>
                      <h3>{day.title}</h3>
                      <p>{day.details}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="included" className="travel-detail-card travel-included-grid">
              <div>
                <h2>Аяллын үнэд багтсан зүйлс</h2>
                <CheckList items={travelPackage.included} />
              </div>
              <div>
                <h2>Үнэд багтаагүй зүйлс</h2>
                <CheckList items={travelPackage.excluded} />
              </div>
            </section>

            {travelPackage.warning ? (
              <section id="warning" className="travel-detail-card travel-warning-card">
                <h2>Анхааруулга</h2>
                <p>{travelPackage.warning}</p>
              </section>
            ) : null}
          </div>

          <TravelBookingPanel travelPackage={travelPackage} />
        </div>
      </main>
      <Footer />
    </>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="travel-check-list">
      {items.map((item) => (
        <li key={item}><span>✓</span>{item}</li>
      ))}
    </ul>
  )
}
