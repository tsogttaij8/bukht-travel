"use client"

import { useRouter } from "next/navigation"
import { glassCard, pageSection, sectionKicker, sectionSubtitle, sectionTitle, shell } from "./ui/tw"

const services = [
  ["01", "BUKHT Travel", "Худалдааны аялал, маршрут, орчуулагч, зохион байгуулалт.", "/travel"],
  ["02", "BUKHT Commerce", "Хямд бөөний бараа, Ready бүтээгдэхүүн, захиалгын менежмент.", "/shop"],
  ["03", "BUKHT eSIM", "Хятад аялалд зориулсан дата багц, QR-аар шууд идэвхжүүлэлт.", "/esim"],
  ["04", "BUKHT Cargo", "Нэгтгэл, ачилт, хүргэлт, tracking, үнэ тооцоолол.", "/cargo"],
] as const

export default function Services() {
  const router = useRouter()

  return (
    <section className={pageSection}>
      <div className={shell}>
        <span className={sectionKicker}>Service ecosystem</span>
        <h2 className={`${sectionTitle} mt-4`}>4 Үндсэн үйлчилгээ</h2>
        <p className={`${sectionSubtitle} mt-4 max-w-[700px]`}>
          БУКНТ экосистем нь аялал, худалдаа, eSIM, карго гэсэн үндсэн урсгалуудыг нэг UX-д нэгтгэдэг.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map(([index, title, text, href]) => (
            <article
              key={title}
              onClick={() => router.push(href)}
              className={`${glassCard} cursor-pointer transition hover:-translate-y-1`}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7d4d34,#f0bd72)] text-sm font-extrabold text-white">
                {index}
              </span>
              <h3 className="mt-5 font-[var(--font-heading)] text-xl text-[#2f241b]">{title}</h3>
              <p className="mt-3 leading-7 text-[#564d44]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
