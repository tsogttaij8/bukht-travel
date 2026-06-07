import OwnerConnectedModulePage from "../../../components/owner/OwnerConnectedModulePage"
import OwnerWorkspaceShell from "../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerEsimPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="eSIM" description="Reserved owner area for eSIM package management." user={{ name: session.name, email: session.email }}>
      <OwnerConnectedModulePage title="eSIM management is reserved" moduleName="eSIM" endpoint="/api/admin/esim-packages" dataKey="esimPackages" totalLabel="Total packages" />
    </OwnerWorkspaceShell>
  )
}
