import { notFound } from "next/navigation"
import Footer from "../../../../../../components/Footer"
import Navbar from "../../../../../../components/Navbar"
import TravelBookingPanel from "../../../../../../components/TravelBookingPanel"
import OwnerTourPreviewActions from "../../../../../../components/owner/OwnerTourPreviewActions"
import { requireRole } from "../../../../../../lib/server/role-guard"
import { getOwnerTravelPackage } from "../../../../../../lib/server/travel-package-store"

type PreviewPageProps = {
  params: Promise<{ id: string }>
}

export default async function OwnerTravelTourPreviewPage({ params }: PreviewPageProps) {
  const session = await requireRole("owner")
  const { id } = await params
  const tour = await getOwnerTravelPackage(`email:${session.email.trim().toLowerCase()}`, id)
  if (!tour) notFound()

  const gallery = [tour.heroImage, ...tour.galleryImages].filter(Boolean).slice(0, 4)

  return (
    <>
      <Navbar />
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-blue-200 bg-blue-50 px-[max(20px,4vw)] py-3 text-blue-950 max-md:flex-col max-md:items-start">
        <strong>Урьдчилан харах горим - хэрэглэгчид таны аяллыг ингэж харна</strong>
        <OwnerTourPreviewActions tourId={tour.id} status={tour.status} />
      </div>
      <main className="travel-detail-page">
        <div className="travel-detail-shell">
          <div className="travel-detail-main">
            <section className="travel-gallery-grid">
              {gallery.length ? gallery.map((image, index) => (
                <div key={`${image}-${index}`} className="travel-gallery-image" style={{ backgroundImage: `url(${image})` }} />
              )) : <div className="travel-gallery-image" />}
            </section>

            <div className="travel-title-row">
              <div>
                <h1>{tour.title}</h1>
                <p>{tour.destination}</p>
              </div>
            </div>

            <nav className="travel-tabs">
              <a href="#intro">Тойм</a>
              <a href="#program">Хөтөлбөр</a>
              <a href="#included">Багтсан зүйлс</a>
              <a href="#policy">Нөхцөл</a>
            </nav>

            <section id="intro" className="travel-detail-card">
              <h2>Тойм</h2>
              <p>{tour.fullDescription || tour.shortDescription}</p>
            </section>

            <section id="program" className="travel-detail-card">
              <h2>Хөтөлбөр</h2>
              <div className="travel-itinerary-list">
                {tour.itinerary.length ? tour.itinerary.map((day, index) => (
                  <article key={`${day.day}-${index}`} className="travel-itinerary-item">
                    <div className="travel-itinerary-date">
                      <strong>{day.day || `${index + 1}-р өдөр`}</strong>
                    </div>
                    <div>
                      <h3>{day.title}</h3>
                      <p>{day.details}</p>
                    </div>
                  </article>
                )) : <p>Хөтөлбөр оруулаагүй байна.</p>}
              </div>
            </section>

            <section id="included" className="travel-detail-card travel-included-grid">
              <div>
                <h2>Үүнд багтсан</h2>
                <CheckList items={tour.included} />
              </div>
              <div>
                <h2>Үүнд багтаагүй</h2>
                <CheckList items={tour.excluded} />
              </div>
            </section>

            <section id="policy" className="travel-detail-card">
              <h2>Төлбөр ба цуцлалт</h2>
              <p>{tour.paymentSettings || "Төлбөрийн заавар оруулаагүй байна."}</p>
              <p>{tour.cancellationPolicy || "Цуцлалтын журам оруулаагүй байна."}</p>
            </section>
          </div>

          <TravelBookingPanel travelPackage={tour} />
        </div>
      </main>
      <Footer />
    </>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="travel-check-list">
      {items.length ? items.map((item) => <li key={item}><span>+</span>{item}</li>) : <li><span>-</span>Мэдээлэл оруулаагүй байна.</li>}
    </ul>
  )
}
