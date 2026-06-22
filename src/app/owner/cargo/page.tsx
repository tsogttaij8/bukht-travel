import OwnerConnectedModulePage from "@/src/app/owner/_components/OwnerConnectedModulePage"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerCargoPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="Cargo" description="Reserved owner area for cargo operations." user={{ name: session.name, email: session.email }}>
      <OwnerConnectedModulePage title="Cargo management is reserved" moduleName="Cargo" endpoint="/api/admin/shipments" dataKey="shipments" totalLabel="Total shipments" />
    </OwnerWorkspaceShell>
  )
}
