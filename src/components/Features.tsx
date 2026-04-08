export default function Features(){
  return(
    <section className="section home-section" style={{paddingTop:0}}>
      <div className="container">
        <span className="section-kicker">Highlights</span>
        <h2 className="section-title">Онцлох боломжууд</h2>
        <div className="card-grid feature-grid" style={{marginTop:22}}>
          <div className="card feature-card feature-card-tall" style={{gridColumn:"span 6"}}>
            <h3>Бэлэн сонголт</h3>
            <p>Хямд үнийн ангилал, MOQ тодорхой, ойлгомжтой танилцуулга.</p>
          </div>
          <div className="card feature-card" style={{gridColumn:"span 3"}}>
            <h3>Ил тод tracking</h3>
            <p>Каргоны төлөв realtime шинэчлэгдэж, шат бүр харагдана.</p>
          </div>
          <div className="card feature-card" style={{gridColumn:"span 3"}}>
            <h3>Хурдан процесс</h3>
            <p>Захиалга баталгаажуулалт, ачилт, хүргэлт streamlined.</p>
          </div>
          <div className="card feature-card" style={{gridColumn:"span 4"}}>
            <h3>Найдвартай баг</h3>
            <p>Хятад-Монголын туршлагатай сүлжээгээр дэмжлэг үзүүлнэ.</p>
          </div>
          <div className="card feature-card" style={{gridColumn:"span 4"}}>
            <h3>Unified account</h3>
            <p>Нэг account-аар хүсэлт, tracking, худалдааны урсгалаа хамтад нь удирдана.</p>
          </div>
          <div className="card feature-card" style={{gridColumn:"span 4"}}>
            <h3>Warm UX</h3>
            <p>Хэрэглэгчид айлгахгүй, хурдан ойлгогдох, зөөлөн боловч хүчтэй интерфэйс.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
