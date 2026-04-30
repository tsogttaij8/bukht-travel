import DeveloperDashboard from "../../../components/DeveloperDashboard"
import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import { requireRole } from "../../../lib/server/role-guard"

export default async function SupportStaffPage() {
  const session = await requireRole("support_staff")

  return (
    <>
      <Navbar />
      <main className="section developer-page">
        <div className="container developer-page-shell">
          <span className="section-kicker">Support staff</span>
          <h1 className="section-title">Support operations</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Сайн байна уу, {session.name}. Хэрэглэгчийн лавлагаа болон shipment төлөв шалгах хэсэг.
          </p>
          <DeveloperDashboard currentRoles={["support_staff"]} />
        </div>
      </main>
      <Footer />
    </>
  )
}

