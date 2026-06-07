import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

export default async function TravelPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = token ? verifySessionToken(token) : null
  const isOwner = session?.roles.includes("owner") ?? false

  if (session && isOwner) {
    redirect("/owner/travel")
  }

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
