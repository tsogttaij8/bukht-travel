import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DeveloperDashboard from "../../components/DeveloperDashboard"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

export default async function DeveloperPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value

  if (!token) {
    redirect("/login")
  }

  const session = verifySessionToken(token)

  if (!session || session.role !== "developer") {
    redirect("/login")
  }

  return (
    <>
      <Navbar />
      <main className="section developer-page">
        <div className="container developer-page-shell">
          <span className="section-kicker">Admin view</span>
          <h1 className="section-title">Developer Dashboard</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Сайн байна уу, {session.name}. Та хөгжүүлэгчийн эрхээр амжилттай нэвтэрлээ.
          </p>
          <DeveloperDashboard />
        </div>
      </main>
      <Footer />
    </>
  )
}
