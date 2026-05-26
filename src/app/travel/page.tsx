import { cookies } from "next/headers"
import DeveloperDashboard from "../../components/DeveloperDashboard"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

export default async function TravelPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = token ? verifySessionToken(token) : null
  const isOwner = session?.roles.includes("owner") ?? false

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
          {session && isOwner ? (
            <section style={{ marginTop: 28 }}>
              <DeveloperDashboard currentRoles={["owner"]} currentUser={{ name: session.name, email: session.email }} enabledTabs={["travel"]} />
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  )
}
