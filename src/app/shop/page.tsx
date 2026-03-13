import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"

const products = [
  { name: "China Travel eSIM", price: "19,900 - 89,900 MNT", moq: "1 багцаас" },
  { name: "Гэр ахуйн бараа", price: "25,000 - 95,000 MNT", moq: "MOQ 10" },
  { name: "Агуулахын хэрэгсэл", price: "18,000 - 140,000 MNT", moq: "MOQ 5" },
  { name: "Цахилгаан хэрэгсэл", price: "40,000 - 280,000 MNT", moq: "MOQ 3" },
  { name: "Хувцас, аксессуар", price: "12,000 - 80,000 MNT", moq: "MOQ 20" },
  { name: "Гоо сайхны бараа", price: "9,000 - 65,000 MNT", moq: "MOQ 12" },
  { name: "Auto дагалдах", price: "30,000 - 220,000 MNT", moq: "MOQ 4" },
]

export default function ShopPage(){
  return(
    <>
      <Navbar/>
      <main className="section">
        <div className="container">
          <h1 className="section-title">Худалдаа (Commerce)</h1>
          <p className="section-subtitle" style={{marginBottom:24}}>
            Хятадаас бөөний бараа татан авах үйл явцыг хялбарчилсан marketplace. Үнэ, MOQ, хүргэлтийн шат ойлгомжтой.
          </p>

          <div className="card-grid">
            {products.map((item) => (
              <article key={item.name} className="card" style={{gridColumn:"span 4"}}>
                <h3>{item.name}</h3>
                <p style={{marginBottom:8}}>Үнэ: {item.price}</p>
                <p>{item.moq}</p>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer/>
    </>
  )
}
