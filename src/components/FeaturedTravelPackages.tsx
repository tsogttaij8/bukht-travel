import type { StoredTravelPackage } from "../lib/server/travel-package-store"
import { pageSection, sectionKicker, sectionTitle, shell } from "./ui/tw"

const cityRoutes = [
  {
    name: "Guangzhou",
    label: "Canton Fair, үйлдвэр, бөөний төв",
    description: "Үзэсгэлэн, supplier уулзалт, үйлдвэр үзэх маршрутаа тусад нь төлөвлөхөд тохиромжтой.",
    focus: ["Үйлдвэр үзэх", "Canton Fair", "Supplier жагсаалт"],
    className: "travel-city-visual-guangzhou",
  },
  {
    name: "Yiwu",
    label: "Futian market ба жижиг бараа",
    description: "Gift shop, online shop, reseller төрлийн бараанд олон лангууг нэг дор үзэж, үнэ хурдан харьцуулна.",
    focus: ["Futian market", "Бага MOQ", "Дээж авах"],
    className: "travel-city-visual-yiwu",
  },
  {
    name: "Shenzhen",
    label: "Электроник, аксессуар, OEM",
    description: "Gadget, дагалдах хэрэгсэл, OEM/ODM уулзалт хийхэд supplier асуултаа сайн бэлдэх хэрэгтэй хот.",
    focus: ["Электроник", "OEM/ODM", "Tech sourcing"],
    className: "travel-city-visual-shenzhen",
  },
]

export default function FeaturedTravelPackages({ travelPackages }: { travelPackages: StoredTravelPackage[] }) {
  void travelPackages

  return (
    <section className={`${pageSection} bg-[#f6f1eb]`}>
      <div className={shell}>
        <div className="mb-9 text-center">
          <span className={sectionKicker}>Travel</span>
          <h2 className={`${sectionTitle} mx-auto mt-5 max-w-[720px]`}>
            Аялагчдын хамгийн их сонгож аялдаг хотууд
          </h2>
        </div>

        <div className="travel-city-grid">
          {cityRoutes.map((city) => (
            <article key={city.name} className="travel-city-card">
              <div className="travel-city-summary">
                <div className={`travel-city-visual ${city.className}`}>
                  <span>{city.label}</span>
                </div>
                <div className="travel-city-copy">
                  <div className="travel-city-topline">
                    <h3>{city.name}</h3>
                  </div>
                  <p>{city.description}</p>
                  <div className="travel-city-tags">
                    {city.focus.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
