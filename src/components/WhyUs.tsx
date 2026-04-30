import { pageSection, sectionTitle, shell } from "./ui/tw"

const reasons = [
  ["Найдвартай", "Баталгаатай процесс, тогтмол статус мэдээлэл."],
  ["Түргэн", "Замнал тодорхой, дамжлага цөөн, хурдтай гүйцэтгэл."],
  ["Ойлгомжтой", "Цэвэр интерфэйс, ойлгомжтой алхам, шууд CTA."],
  ["Говийн сүнс", "Монгол өнгө аястай ч international хэв маяг."],
] as const

export default function WhyUs() {
  return (
    <section className={`${pageSection} pt-0`}>
      <div className={`${shell} rounded-[32px] border border-[rgba(112,67,43,0.2)] bg-[linear-gradient(140deg,rgba(92,55,36,0.96),rgba(138,84,52,0.92))] p-8 shadow-[0_28px_56px_rgba(83,51,32,0.22)]`}>
        <span className="inline-flex w-fit items-center rounded-full bg-[rgba(255,245,228,0.12)] px-3 py-2 text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-[#fff3e1]">
          Why Bukht
        </span>
        <h2 className={`${sectionTitle} mt-4 text-white`}>Яагаад BUKHT?</h2>
        <p className="mt-3 max-w-[650px] leading-7 text-[#efe0cf]">
          Premium + Clean + Strong чиглэлээр UX/UI-ийг энгийн бөгөөд шийдэлд төвлөрсөн байдлаар боловсруулсан.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {reasons.map(([title, text]) => (
            <article
              key={title}
              className="rounded-3xl border border-[rgba(226,194,160,0.18)] bg-[rgba(255,255,255,0.06)] p-6 backdrop-blur-md"
            >
              <h3 className="font-[var(--font-heading)] text-xl text-white">{title}</h3>
              <p className="mt-3 leading-7 text-[#f0dfcf]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
