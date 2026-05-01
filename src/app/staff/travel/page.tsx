import DeveloperDashboard from "../../../components/DeveloperDashboard"
import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import { requireRole } from "../../../lib/server/role-guard"

export default async function TravelStaffPage() {
  const session = await requireRole("travel_staff")

  return (
    <>
      <Navbar />
      <main className="section developer-page">
        <div className="container developer-page-shell">
          <span className="section-kicker">Travel staff</span>
          <h1 className="section-title">Travel operations</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>Сайн байна уу, {session.name}. Аялал нийтлэх, үнэ болон хөтөлбөрийн мэдээлэл удирдах хэсэг.</p>
          <DeveloperDashboard currentRoles={["travel_staff"]} />
        </div>
      </main>
      <Footer />
    </>
  )
}
