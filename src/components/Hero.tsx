"use client"

import { useRouter } from "next/navigation"

export default function Hero(){
  const router = useRouter()

  return(
    <section className="section fade-up">
      <div className="container hero-layout" style={{display:"grid",gap:28,alignItems:"stretch"}}>
        <div style={{background:"#f4efe8",border:"1px solid #e4d8c6",borderRadius:18,padding:"42px 34px"}}>
          <div style={{display:"flex",marginBottom:26,overflow:"hidden",borderRadius:10}}>
            <div style={{height:16,width:90,background:"#8a5a3c"}} />
            <div style={{height:16,flex:1,background:"#d8b98a"}} />
          </div>

          <p style={{margin:"0 0 10px",textTransform:"uppercase",letterSpacing:1.2,fontWeight:700,color:"#6f6558"}}>
            Gobi Camel Spirit + Modern Trust Platform
          </p>

          <h1 style={{margin:"0 0 16px",fontFamily:"var(--font-heading), sans-serif",fontSize:"clamp(2rem,4.5vw,3.4rem)",lineHeight:1.08}}>
            Хятад, Монголыг холбосон
            <br />
            найдвартай нэг платформ
          </h1>

          <p style={{margin:"0 0 28px",maxWidth:620,color:"#4c4c4c",lineHeight:1.7}}>
            Аялал, худалдаа, карго үйлчилгээг нэг дороос. Хурдан, ойлгомжтой, хүчтэй экосистем.
          </p>

          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <button className="btn btn-primary" onClick={()=>router.push("/travel")}>
              Аялал захиалах
            </button>
            <button className="btn btn-secondary" onClick={()=>router.push("/cargo")}>
              Карго tracking
            </button>
          </div>
        </div>

        <aside style={{display:"grid",gap:14}}>
          {[
            ["Vision", "Хятад-Монгол худалдаа, аялал, логистикийн нэгдсэн экосистем."],
            ["Brand Pillars", "Trust • Speed • Clarity • Gobi Spirit"],
            ["Tone", "Товч, дулаан, шийдэлд төвлөрсөн харилцаа."]
          ].map(([title, text]) => (
            <div key={title} className="card" style={{background:"#fffdf9"}}>
              <h3 style={{marginBottom:8}}>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </aside>
      </div>
    </section>
  )
}
