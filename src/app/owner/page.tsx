import OwnerDashboard from "../../components/owner/OwnerDashboard"
import OwnerWorkspaceShell from "../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../lib/server/role-guard"

export const dynamic = "force-dynamic"

export default async function OwnerPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell
      title="Platform dashboard"
      description="Manage BUKHT business modules from one owner workspace."
      user={{ name: session.name, email: session.email }}
    >
      <OwnerDashboard />
    </OwnerWorkspaceShell>
  )
}
