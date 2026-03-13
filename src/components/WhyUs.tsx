export default function WhyUs(){
  return(
    <section className="section" style={{paddingTop:0}}>
      <div className="container" style={{background:"#1d1d1d",color:"#fff",borderRadius:20,padding:"40px 28px"}}>
        <h2 className="section-title" style={{color:"#fff",marginBottom:10}}>Яагаад BUKHT?</h2>
        <p style={{margin:"0 0 22px",maxWidth:650,lineHeight:1.6,color:"#d7d7d7"}}>
          Premium + Clean + Strong чиглэлээр UX/UI-ийг энгийн бөгөөд шийдэлд төвлөрсөн байдлаар боловсруулсан.
        </p>
        <div className="card-grid">
          {[
            ["Найдвартай", "Баталгаатай процесс, тогтмол статус мэдээлэл."],
            ["Түргэн", "Замнал тодорхой, дамжлага цөөн, хурдтай гүйцэтгэл."],
            ["Ойлгомжтой", "Цэвэр интерфэйс, ойлгомжтой алхам, шууд CTA."],
            ["Говийн сүнс", "Монгол өнгө аястай ч international хэв маяг."]
          ].map(([title, text]) => (
            <article key={title} className="card" style={{gridColumn:"span 3",background:"#262626",borderColor:"#3d3d3d"}}>
              <h3 style={{color:"#fff"}}>{title}</h3>
              <p style={{color:"#d0d0d0"}}>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
