"use client"

import { useRouter } from "next/navigation"

export default function Hero(){
  const router = useRouter()

  const sidebarItems = [
    ["Vision", "Хятад-Монгол худалдаа, аялал, логистикийн нэгдсэн экосистем."],
    ["Brand Pillars", "Trust • Speed • Clarity • Gobi Spirit"],
    ["Tone", "Товч, дулаан, шийдэлд төвлөрсөн харилцаа."],
  ]

  const heroStats = [
    ["CN-MN", "market bridge"],
    ["24/7", "status visibility"],
    ["Email", "simple access flow"],
  ]

  return(
    <section className="section fade-up">
      <div className="container hero-layout" style={{display:"grid",gap:28,alignItems:"stretch"}}>
        <div className="hero-primary-panel">
          <div className="hero-floating-orb hero-floating-orb-one" />
          <div className="hero-floating-orb hero-floating-orb-two" />

          <div style={{display:"flex",marginBottom:26,overflow:"hidden",borderRadius:999}}>
            <div style={{height:16,width:90,background:"linear-gradient(135deg, #7d4d34, #b76845)"}} />
            <div style={{height:16,flex:1,background:"linear-gradient(90deg, #f0c17c, #ffe5b8)"}} />
          </div>

          <p style={{margin:"0 0 10px",textTransform:"uppercase",letterSpacing:1.2,fontWeight:700,color:"#7d624e"}}>
            Gobi Camel Spirit + Modern Trust Platform
          </p>

          <h1 style={{margin:"0 0 16px",fontFamily:"var(--font-heading), sans-serif",fontSize:"clamp(2rem,4.5vw,3.4rem)",lineHeight:1.08}}>
            Хятад, Монголыг холбосон
            <br />
            найдвартай нэг платформ
          </h1>

          <p style={{margin:"0 0 28px",maxWidth:620,color:"#534b43",lineHeight:1.7}}>
            Аялал, худалдаа, карго үйлчилгээг нэг дороос. Хүн бүр эхлээд чөлөөтэй үзэж танилцаад, хүсэлт илгээх үедээ имэйлээр нэвтэрч өөрийн account дээрээ үргэлжлүүлнэ.
          </p>

          <div className="hero-chip-strip">
            <span className="hero-soft-chip">Live tracking</span>
            <span className="hero-soft-chip">Human support</span>
            <span className="hero-soft-chip">Fast onboarding</span>
          </div>

          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className="btn btn-primary" onClick={()=>router.push("/travel")}>
              Аялал захиалах
            </button>
            <button className="btn btn-secondary" onClick={()=>router.push("/cargo")}>
              Карго tracking
            </button>
          </div>

          <div className="hero-stat-row">
            {heroStats.map(([value, label]) => (
              <div key={value} className="hero-stat-card">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="hero-sidebar">
          <div className="hero-sidebar-shell">
            <div className="hero-sidebar-shell-top">
              <span className="hero-sidebar-kicker">Core signals</span>
              <p style={{margin:0,color:"rgba(255,244,230,0.78)",lineHeight:1.6}}>
                Илүү тод өнгө, илүү ойлгомжтой блок, хурдан уншигдах hierarchy.
              </p>
            </div>

            {sidebarItems.map(([title, text], index) => (
              <div
                key={title}
                className="card hero-sidebar-card"
                style={{
                  background: [
                    "linear-gradient(180deg, rgba(255, 242, 226, 0.98), rgba(255, 219, 179, 0.82))",
                    "linear-gradient(180deg, rgba(255, 238, 209, 0.98), rgba(243, 186, 114, 0.78))",
                    "linear-gradient(180deg, rgba(255, 243, 236, 0.98), rgba(244, 202, 188, 0.8))",
                  ][index],
                }}
              >
                <span className="hero-sidebar-accent">{`0${index + 1}`}</span>
                <span className="hero-sidebar-glow" />
                <h3 style={{marginBottom:8}}>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
