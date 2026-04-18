import { shell } from "./ui/tw"

export default function Hero(){
  return(
    <section
      className="flex min-h-[calc(100vh-97px)] items-stretch bg-[linear-gradient(90deg,rgba(18,11,6,0.76)_0%,rgba(18,11,6,0.42)_28%,rgba(18,11,6,0.08)_50%,rgba(18,11,6,0.02)_100%),url('/home-hero-camel.jfif')] bg-cover bg-center bg-no-repeat py-18 max-md:min-h-[70vh] max-md:[background-position:58%_center] max-md:py-14 max-sm:py-10"
    >
      <div className={`${shell} flex min-h-[calc(100vh-97px-144px)] items-center justify-start max-md:min-h-[70vh]`}>
        <div className="mx-auto w-[min(50%,560px)] p-0 text-center max-sm:mx-0 max-sm:w-full max-sm:max-w-[320px] max-sm:text-left">
          <h1 className="m-0 font-[var(--font-heading)] text-[24px] leading-[1.15] text-[#fff6ea] shadow-black/30 [text-shadow:0_10px_34px_rgba(0,0,0,0.3)]">
            Хятад, Монголыг холбосон
            <br />
             платформ
          </h1>
        </div>
      </div>
    </section>
  )
}
