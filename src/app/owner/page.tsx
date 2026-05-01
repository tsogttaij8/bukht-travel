import DeveloperDashboard from "../../components/DeveloperDashboard"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { requireRole } from "../../lib/server/role-guard"

export default async function OwnerPage() {
  const session = await requireRole("owner")

  return (
    <>
      <Navbar />
      <main className="section developer-page">
        <div className="container developer-page-shell">
          <span className="section-kicker">Owner console</span>
          <h1 className="section-title">Owner workspace</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Сайн байна уу, {session.name}. Энд staff эрх, аялал нийтлэх, бараа болон shipment удирдлагын хэсгүүд байна.
          </p>
          <DeveloperDashboard currentRoles={["owner"]} currentUser={{ name: session.name, email: session.email }} />
        </div>
      </main>
      <Footer />
    </>
  )
}
