"use client"

import { useRouter } from "next/navigation"

export default function Services(){

const router = useRouter()

return(

<section className="section">
  <div className="container">
    <h2 className="section-title">4 Үндсэн үйлчилгээ</h2>
    <p className="section-subtitle">
      БУКНТ экосистем нь аялал, худалдаа, eSIM, карго гэсэн үндсэн урсгалуудыг нэг UX-д нэгтгэдэг.
    </p>

    <div className="card-grid" style={{marginTop:24}}>
      <article className="card" style={{gridColumn:"span 3",cursor:"pointer"}} onClick={()=>router.push("/travel")}>
        <h3>BUKHT Travel</h3>
        <p>Худалдааны аялал, маршрут, орчуулагч, зохион байгуулалт.</p>
      </article>

      <article className="card" style={{gridColumn:"span 3",cursor:"pointer"}} onClick={()=>router.push("/shop")}>
        <h3>BUKHT Commerce</h3>
        <p>Хямд бөөний бараа, Ready бүтээгдэхүүн, захиалгын менежмент.</p>
      </article>

      <article className="card" style={{gridColumn:"span 3",cursor:"pointer"}} onClick={()=>router.push("/esim")}>
        <h3>BUKHT eSIM</h3>
        <p>Хятад аялалд зориулсан дата багц, QR-аар шууд идэвхжүүлэлт.</p>
      </article>

      <article className="card" style={{gridColumn:"span 3",cursor:"pointer"}} onClick={()=>router.push("/cargo")}>
        <h3>BUKHT Cargo</h3>
        <p>Нэгтгэл, ачилт, хүргэлт, tracking, үнэ тооцоолол.</p>
      </article>
    </div>
  </div>
</section>

)

}
