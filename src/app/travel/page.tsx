import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"

export default function TravelPage() {
  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <section style={{ textAlign: "center" }}>
            <span className="section-kicker">Travel</span>
            <h1 className="section-title" style={{ marginTop: 16 }}>Аялал</h1>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Одоогоор зарлагдсан аялал байхгүй байна.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
