import DeveloperDashboard from "../../../components/DeveloperDashboard"
import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import { requireRole } from "../../../lib/server/role-guard"

export default async function CargoStaffPage() {
  const session = await requireRole("cargo_staff")

  return (
    <>
      <Navbar />
      <main className="section developer-page">
        <div className="container developer-page-shell">
          <span className="section-kicker">Cargo staff</span>
          <h1 className="section-title">Cargo operations</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Сайн байна уу, {session.name}. Карго бүртгэл, shipment төлөв, shop барааны ажлууд энд байна.
          </p>
          <DeveloperDashboard currentRoles={["cargo_staff"]} currentUser={{ name: session.name, email: session.email }} />
        </div>
      </main>
      <Footer />
    </>
  )
}
