import OwnerPlaceholderPage from "@/src/app/owner/_components/OwnerPlaceholderPage"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerAnalyticsPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="Analytics" description="Platform analytics area." user={{ name: session.name, email: session.email }}>
      <OwnerPlaceholderPage title="Analytics are not connected yet" moduleName="Analytics" body="No booking, payment, revenue, or review analytics backend is connected yet." />
    </OwnerWorkspaceShell>
  )
}
