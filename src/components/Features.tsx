import { glassCard, pageSection, sectionKicker, sectionTitle, shell } from "./ui/tw"

const features = [
  ["col-span-1 md:col-span-2", "Бэлэн сонголт", "Хямд үнийн ангилал, MOQ тодорхой, ойлгомжтой танилцуулга."],
  ["col-span-1", "Ил тод tracking", "Каргоны төлөв realtime шинэчлэгдэж, шат бүр харагдана."],
  ["col-span-1", "Хурдан процесс", "Захиалга баталгаажуулалт, ачилт, хүргэлт streamlined."],
  ["col-span-1", "Найдвартай баг", "Хятад-Монголын туршлагатай сүлжээгээр дэмжлэг үзүүлнэ."],
  ["col-span-1", "Unified account", "Нэг account-аар хүсэлт, tracking, худалдааны урсгалаа хамтад нь удирдана."],
  ["col-span-1", "Warm UX", "Хэрэглэгчид айлгахгүй, хурдан ойлгогдох, зөөлөн боловч хүчтэй интерфэйс."],
] as const

export default function Features() {
  return (
    <section className={`${pageSection} pt-0`}>
      <div className={shell}>
        <span className={sectionKicker}>Highlights</span>
        <h2 className={`${sectionTitle} mt-4`}>Онцлох боломжууд</h2>
        <div className="mt-[22px] grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map(([span, title, text]) => (
            <div key={title} className={`${glassCard} ${span}`}>
              <h3 className="font-[var(--font-heading)] text-xl text-[#2f241b]">{title}</h3>
              <p className="mt-3 leading-7 text-[#564d44]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
