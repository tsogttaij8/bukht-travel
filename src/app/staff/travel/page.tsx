import DeveloperDashboard from "../../../components/DeveloperDashboard"
import { requireRole } from "../../../lib/server/role-guard"

export default async function TravelStaffPage() {
  const session = await requireRole("travel_staff")

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <DeveloperDashboard currentRoles={["travel_staff"]} currentUser={{ name: session.name, email: session.email }} enabledTabs={["travel"]} />
    </main>
  )
}
