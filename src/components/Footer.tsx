import { sectionKicker, shell } from "./ui/tw"

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(218,197,169,0.8)] bg-[rgba(255,248,239,0.8)] py-8">
      <div className={`${shell} grid gap-6 md:grid-cols-[1fr_auto] md:items-center`}>
        <div className="grid gap-2.5">
          <span className={sectionKicker}>BUKHT Network</span>
          <p className="m-0 font-[var(--font-heading)] text-[1.1rem] text-[#4f473e]">
            Trade, travel, cargo in one calm interface.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-[#5e554b]">
          <p className="m-0">BUKHT • Brandbook + Web/App Design Brief</p>
          <p className="m-0">Холбоо: +976 9989 8938</p>
        </div>
      </div>
    </footer>
  )
}
