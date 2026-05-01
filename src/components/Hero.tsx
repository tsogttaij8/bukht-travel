import Link from "next/link"
import { shell } from "./ui/tw"

export default function Hero({ isLoggedIn = false }: { isLoggedIn?: boolean }){
  return(
    <section
      className="flex min-h-[calc(100vh-97px)] items-stretch bg-[linear-gradient(90deg,rgba(18,11,6,0.76)_0%,rgba(18,11,6,0.42)_28%,rgba(18,11,6,0.08)_50%,rgba(18,11,6,0.02)_100%),url('/home-hero-camel.jfif')] bg-cover bg-center bg-no-repeat py-18 max-md:min-h-[70vh] max-md:[background-position:58%_center] max-md:py-14 max-sm:py-10"
    >
      <div className={`${shell} flex min-h-[calc(100vh-97px-144px)] items-center justify-start max-md:min-h-[70vh]`}>
        <div className="w-[min(58%,620px)] p-0 text-left max-sm:w-full max-sm:max-w-[340px]">
          <span className="mb-6 inline-flex rounded-full border border-[#a87b22] px-4 py-1 text-[14px] font-medium uppercase tracking-[0.08em] text-[#f0bd72]">
            Хятад · Монгол
          </span>
          <h1 className="m-0 font-[var(--font-heading)] text-[32px] font-semibold leading-[1.2] text-[#fff6ea] shadow-black/30 [text-shadow:0_10px_34px_rgba(0,0,0,0.3)]">
            Хятад, Монголыг холбосон
            <br />
             платформ
          </h1>
          <p className="mt-6 mb-0 text-[24px] font-semibold leading-[1.25] text-[#d7d0ca] [text-shadow:0_8px_26px_rgba(0,0,0,0.32)]">
            Аялал · Худалдаа · eSIM · Карго
          </p>
          <p className="mt-12 mb-0 text-[16px] leading-[1.6] text-[#b8afa6] [text-shadow:0_8px_24px_rgba(0,0,0,0.28)]">
            Нэг бүртгэл — дөрвөн үйлчилгээ.
          </p>
          {!isLoggedIn ? (
            <Link
            href="/login"
            className="mt-9 inline-flex rounded-[9px] bg-[#f47c18] px-8 py-3 text-[17px] font-bold text-white shadow-[0_16px_34px_rgba(0,0,0,0.22)] transition-colors duration-200 ease-out hover:bg-[#ff8b25]"
          >
            Нэвтрэх →
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
