import OwnerPlaceholderPage from "../../../components/owner/OwnerPlaceholderPage"
import OwnerWorkspaceShell from "../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerAnalyticsPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="Analytics" description="Platform analytics area." user={{ name: session.name, email: session.email }}>
      <OwnerPlaceholderPage title="Analytics are not connected yet" moduleName="Analytics" body="No booking, payment, revenue, or review analytics backend is connected yet." />
    </OwnerWorkspaceShell>
  )
}
