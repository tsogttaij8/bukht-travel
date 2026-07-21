import { Clock3 } from "lucide-react"
import Footer from "./Footer"
import Navbar from "./Navbar"
import { comingSoonServices, type ComingSoonService } from "../lib/coming-soon-content"

export default function ServiceComingSoon({ service }: { service: ComingSoonService }) {
  const content = comingSoonServices[service]

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="container flex min-h-[70vh] items-center justify-center py-16 text-center">
        <section className="mx-auto flex max-w-2xl flex-col items-center">
          <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#f2e9dc] text-[#8c6239] shadow-[0_18px_45px_rgba(93,63,35,0.12)]">
            <Clock3 aria-hidden="true" size={34} strokeWidth={1.8} />
          </div>
          <span className="section-kicker">{content.eyebrow}</span>
          <h1 className="section-title mt-3">Тун удахгүй</h1>
          <p className="section-subtitle mt-4 max-w-xl">{content.description}</p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#8c7a68]">
            {content.title}
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
