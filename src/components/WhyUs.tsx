export default function WhyUs(){
  return(
    <section className="section home-section" style={{paddingTop:0}}>
      <div className="container whyus-shell">
        <span className="section-kicker section-kicker-dark">Why Bukht</span>
        <h2 className="section-title" style={{color:"#fff",marginBottom:10}}>Яагаад BUKHT?</h2>
        <p style={{margin:"0 0 22px",maxWidth:650,lineHeight:1.6,color:"#efe0cf"}}>
          Premium + Clean + Strong чиглэлээр UX/UI-ийг энгийн бөгөөд шийдэлд төвлөрсөн байдлаар боловсруулсан.
        </p>
        <div className="card-grid">
          {[
            ["Найдвартай", "Баталгаатай процесс, тогтмол статус мэдээлэл."],
            ["Түргэн", "Замнал тодорхой, дамжлага цөөн, хурдтай гүйцэтгэл."],
            ["Ойлгомжтой", "Цэвэр интерфэйс, ойлгомжтой алхам, шууд CTA."],
            ["Говийн сүнс", "Монгол өнгө аястай ч international хэв маяг."]
          ].map(([title, text]) => (
            <article key={title} className="card whyus-card" style={{gridColumn:"span 3"}}>
              <h3 style={{color:"#fff"}}>{title}</h3>
              <p style={{color:"#f0dfcf"}}>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
