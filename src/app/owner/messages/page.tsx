import OwnerPlaceholderPage from "../../../components/owner/OwnerPlaceholderPage"
import OwnerWorkspaceShell from "../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerMessagesPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="Messages" description="Platform messages area." user={{ name: session.name, email: session.email }}>
      <OwnerPlaceholderPage title="Messages are not connected yet" moduleName="Messages" body="No owner messaging backend is connected yet." />
    </OwnerWorkspaceShell>
  )
}
