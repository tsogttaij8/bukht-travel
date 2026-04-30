import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import StaffRoleConsole from "../../../components/StaffRoleConsole"
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
          <p className="section-subtitle" style={{ marginBottom: 24 }}>Сайн байна уу, {session.name}.</p>
          <StaffRoleConsole
            title="Travel workspace"
            summary="Аяллын хүсэлт, booking, itinerary болон хэрэглэгчтэй холбогдох ажлууд энэ role-д тусгаарлагдана."
            panels={["Travel requests", "Bookings", "Itinerary notes"]}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}

