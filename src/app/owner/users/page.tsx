import OwnerUsersManager from "../../../components/owner/OwnerUsersManager"
import OwnerWorkspaceShell from "../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerUsersPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell
      title="Users"
      description="Manage real backend users and supported module owner roles."
      user={{ name: session.name, email: session.email }}
    >
      <OwnerUsersManager />
    </OwnerWorkspaceShell>
  )
}
