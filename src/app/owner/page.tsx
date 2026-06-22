import OwnerDashboard from "@/src/app/owner/_components/OwnerDashboard"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
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
