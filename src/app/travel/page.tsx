import { cookies } from "next/headers"
import Link from "@/src/components/ui/TrackedLink"
import { redirect } from "next/navigation"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"
import { listTravelPackages, type StoredTravelPackage } from "../../lib/server/travel-package-store"

export const dynamic = "force-dynamic"

export default async function TravelPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = token ? verifySessionToken(token) : null
  const isOwner = session?.roles.includes("owner") ?? false
  let travelPackages: StoredTravelPackage[] = []

  if (session && isOwner) {
    redirect("/owner/travel")
  }

  try {
    travelPackages = (await listTravelPackages()).filter((item) => item.status === "published")
  } catch {
    travelPackages = []
  }

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <section style={{ textAlign: "center" }}>
            <span className="section-kicker">Travel</span>
          </section>

          {travelPackages.length ? (
            <section className="mt-10 grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
              {travelPackages.map((item) => (
                <TravelListCard key={item.id} item={item} />
              ))}
            </section>
          ) : (
            <p className="mx-auto mt-10 max-w-[560px] rounded-lg border border-dashed border-[#d9c6aa] bg-[#fffaf4] px-5 py-6 text-center text-sm font-bold text-[#7a6a5c]">
              Одоогоор зарлагдсан аялал байхгүй байна.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function TravelListCard({ item }: { item: StoredTravelPackage }) {
  const image = item.heroImage || item.galleryImages[0] || "/travel-guangzhou-city-highlights.jpeg"
  return (
    <Link href={`/travel/${item.id}`} className="grid overflow-hidden rounded-[18px] border border-[rgba(226,209,183,0.82)] bg-white text-left shadow-[0_18px_42px_rgba(120,88,58,0.1)] transition hover:-translate-y-0.5">
      <span className="min-h-52 bg-[#eadcca] bg-cover bg-center" style={{ backgroundImage: cssImage(image) }} />
      <span className="grid gap-3 p-5">
        <span className="text-xs font-black uppercase text-[#7c5637]">{item.location || item.destination}</span>
        <strong className="font-[var(--font-heading)] text-xl leading-tight text-[#241a12]">{item.title}</strong>
        <span className="line-clamp-2 text-sm font-medium leading-6 text-[#6b5b4c]">{item.shortDescription || item.summary}</span>
        <span className="mt-1 flex flex-wrap gap-2 text-xs font-black text-[#7a6a5c]">
          <span>{item.duration}</span>
          <span>·</span>
          <span>{formatMoney(item.price || item.adultPrice, item.priceCurrency)}</span>
        </span>
      </span>
    </Link>
  )
}

function formatMoney(value: number, currency: "MNT" | "CNY"): string {
  if (!value) return "Үнэ тохиролцоно"
  return `${new Intl.NumberFormat("mn-MN").format(value)} ${currency}`
}

function cssImage(value: string): string {
  return `url("${value.replace(/"/g, '\\"')}")`
}
