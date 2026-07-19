import Image from "next/image"
import Link from "@/src/components/ui/TrackedLink"

export default function Hero() {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-shell home-hero__inner">
        <div className="home-hero__copy">
          <h1 id="home-title">
            Хятад руу хийх бүх<br />
            худалдаа, аялал, карго<br />
            <span>нэг платформ</span> дээр.
          </h1>
          <p>Аялал, худалдаа, карго тээвэр болон eSIM үйлчилгээг хялбар, найдвартай, нэг дороос аваарай.</p>
          <Link href="/travel" className="home-button home-button--accent">Аялал эхлэх <span aria-hidden="true">→</span></Link>
        </div>
        <div className="home-hero__visual">
          <Image src="/home-hero-camel.jfif" alt="Хятад дахь аялал, худалдааны орчин" fill priority sizes="(max-width: 800px) 100vw, 60vw" />
        </div>
      </div>
    </section>
  )
}
