import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import StaffRoleConsole from "../../../components/StaffRoleConsole"
import { requireRole } from "../../../lib/server/role-guard"

export default async function FinanceStaffPage() {
  const session = await requireRole("finance_staff")

  return (
    <>
      <Navbar />
      <main className="section developer-page">
        <div className="container developer-page-shell">
          <span className="section-kicker">Finance staff</span>
          <h1 className="section-title">Finance operations</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>Сайн байна уу, {session.name}.</p>
          <StaffRoleConsole
            title="Finance workspace"
            summary="Төлбөр, үлдэгдэл, invoice, refund, тайлангийн ажлууд энэ role-д тусгаарлагдана."
            panels={["Payments", "Invoices", "Reports"]}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}

