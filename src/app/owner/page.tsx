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
          <h1 className="section-title">Staff access</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Сайн байна уу, {session.name}. Owner хэсэгт зөвхөн ажилтны эрх, role, status удирдана.
          </p>
          <DeveloperDashboard currentRoles={["owner"]} />
        </div>
      </main>
      <Footer />
    </>
  )
}

