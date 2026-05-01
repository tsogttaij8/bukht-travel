import Link from "next/link"
import type { StoredTravelPackage } from "../lib/server/travel-package-store"
import { pageSection, sectionKicker, sectionSubtitle, sectionTitle, shell } from "./ui/tw"

export default function FeaturedTravelPackages({ travelPackages }: { travelPackages: StoredTravelPackage[] }) {
  return (
    <section className={`${pageSection} bg-[#f6f1eb]`}>
      <div className={shell}>
        <div className="mb-10 text-center">
          <span className={sectionKicker}>Travel</span>
          <h2 className={`${sectionTitle} mt-4`}>Онцлох аялал</h2>
          <p className={`${sectionSubtitle} mx-auto mt-4 max-w-[680px]`}>
            Owner хэсгээс нийтэлсэн аяллууд энд шууд харагдана.
          </p>
        </div>

        {travelPackages.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {travelPackages.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-[8px] border border-[#ded6cc] bg-white shadow-[0_14px_34px_rgba(54,42,31,0.08)]">
                <Link href={`/travel/${item.slug}`} className="block">
                  <div className="relative min-h-[230px] bg-[#e9dfd4] bg-cover bg-center" style={{ backgroundImage: `url(${item.heroImage})` }}>
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-[18px] bg-[#f95b63] px-6 py-2 text-sm font-extrabold uppercase text-white shadow-md">
                      BUKHT онцлох
                    </span>
                  </div>
                </Link>
                <div className="grid gap-3 p-5">
                  <span className="text-sm font-semibold text-[#234257]">⌖ {item.location}</span>
                  <h3 className="min-h-[3.2em] text-[18px] font-extrabold leading-[1.25] text-[#111827]">{item.title}</h3>
                  <p className="line-clamp-2 text-sm leading-6 text-[#5d6673]">{item.summary}</p>
                  <div className="flex items-center justify-between border-t border-[#ece6de] pt-4 text-sm">
                    <span className="font-semibold text-[#273444]">☼ {item.duration}</span>
                    <span className="font-semibold text-[#273444]">👥 {item.groupSize}</span>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="text-xs text-[#8a7d70]">Эхлэх үнэ</span>
                      <strong className="block text-[20px] text-[#111827]">{formatMoney(item.adultPrice)}</strong>
                    </div>
                    <Link href={`/travel/${item.slug}`} className="rounded-[8px] bg-[#eef3fb] px-6 py-3 text-sm font-extrabold text-[#0f2137] transition hover:bg-[#dce8f8]">
                      Захиалах
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-dashed border-[#cdbfaa] bg-white/72 p-8 text-center font-semibold text-[#6f6256]">
            Одоогоор зарлагдсан аялал байхгүй байна.
          </div>
        )}
      </div>
    </section>
  )
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ₮`
}
