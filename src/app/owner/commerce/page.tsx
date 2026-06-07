import OwnerConnectedModulePage from "../../../components/owner/OwnerConnectedModulePage"
import OwnerWorkspaceShell from "../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerCommercePage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="Commerce" description="Reserved owner area for commerce management." user={{ name: session.name, email: session.email }}>
      <OwnerConnectedModulePage title="Commerce management is reserved" moduleName="Commerce" endpoint="/api/admin/products" dataKey="products" totalLabel="Total products" />
    </OwnerWorkspaceShell>
  )
}
