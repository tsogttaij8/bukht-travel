import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import StaffRoleConsole from "../../../components/StaffRoleConsole"
import { requireRole } from "../../../lib/server/role-guard"

export default async function EsimStaffPage() {
  const session = await requireRole("esim_staff")

  return (
    <>
      <Navbar />
      <main className="section developer-page">
        <div className="container developer-page-shell">
          <span className="section-kicker">eSIM staff</span>
          <h1 className="section-title">eSIM operations</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>Сайн байна уу, {session.name}.</p>
          <StaffRoleConsole
            title="eSIM workspace"
            summary="eSIM захиалга, activation, provider status болон хэрэглэгчийн хүсэлтүүд энэ role-д тусгаарлагдана."
            panels={["eSIM orders", "Activation queue", "Provider status"]}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}

