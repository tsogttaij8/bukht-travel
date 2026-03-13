import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Image from "next/image"

const plans = [
  { name: "Starter 3GB / 7 хоног", price: "19,900 MNT", note: "China data only" },
  { name: "Pro 10GB / 15 хоног", price: "49,900 MNT", note: "China + hotspot" },
  { name: "Business 20GB / 30 хоног", price: "89,900 MNT", note: "Priority network" },
]

export default function EsimPage(){
  return(
    <>
      <Navbar/>
      <main className="section">
        <div className="container">
          <h1 className="section-title">eSIM Дата багц</h1>
          <p className="section-subtitle" style={{marginBottom:24}}>
            Хятад аялалд зориулсан eSIM багцууд. QR кодоор 2-3 минутанд идэвхжүүлээд шууд дата ашиглана.
          </p>

          <div className="card-grid" style={{marginBottom:20}}>
            {plans.map((plan) => (
              <article key={plan.name} className="card" style={{gridColumn:"span 4"}}>
                <h3>{plan.name}</h3>
                <p style={{marginBottom:8}}>Үнэ: {plan.price}</p>
                <p>{plan.note}</p>
              </article>
            ))}
          </div>

          <section className="card" style={{background:"#fffdf9"}}>
            <h3>Идэвхжүүлэх алхам</h3>
            <p style={{marginBottom:8}}>1. Багцаа сонгоно</p>
            <p style={{marginBottom:8}}>2. Төлбөр хийнэ</p>
            <p style={{marginBottom:8}}>3. QR код имэйлээр авна</p>
            <p>4. Утсандаа суулгаад датагаа асаана</p>
          </section>

          <section className="card-grid" style={{marginTop:20}}>
            <article className="card" style={{gridColumn:"span 5"}}>
              <h3 style={{marginBottom:10}}>Khan Bank QR төлбөр</h3>
              <p style={{marginBottom:8}}>Хүлээн авагч: <strong>BUKHT LLC</strong></p>
              <p style={{marginBottom:8}}>Банк: <strong>Khan Bank</strong></p>
              <p style={{marginBottom:8}}>Данс: <strong>5023456789</strong></p>
              <p style={{marginBottom:0}}>Гүйлгээний утга: <strong>Нэр + Утас + eSIM</strong></p>
            </article>

            <article className="card" style={{gridColumn:"span 7",display:"flex",justifyContent:"center"}}>
              <Image
                src="/khanbank-qr-placeholder.svg"
                alt="Khan Bank QR"
                width={280}
                height={280}
                style={{width:"100%",maxWidth:280,height:"auto"}}
              />
            </article>
          </section>

          <p style={{marginTop:12,color:"#5a5349"}}>
            Жинхэнэ QR зураг оруулах бол `public/khanbank-qr.png` файл хийж, дээрх `src`-ийг солиход болно.
          </p>
        </div>
      </main>
      <Footer/>
    </>
  )
}
