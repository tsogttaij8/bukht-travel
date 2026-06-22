import OwnerPlaceholderPage from "@/src/app/owner/_components/OwnerPlaceholderPage"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerSettingsPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="Settings" description="Platform owner settings area." user={{ name: session.name, email: session.email }}>
      <OwnerPlaceholderPage title="Settings are not connected yet" moduleName="Settings" body="No owner settings backend is connected yet." />
    </OwnerWorkspaceShell>
  )
}
