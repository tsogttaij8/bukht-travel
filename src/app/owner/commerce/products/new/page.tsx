import CommerceProductForm from "../../../../../components/owner/commerce/CommerceProductForm"
import OwnerWorkspaceShell from "../../../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../../../lib/server/role-guard"

export default async function NewCommerceProductPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="Бараа нэмэх" description="" user={{ name: session.name, email: session.email }}>
      <CommerceProductForm />
    </OwnerWorkspaceShell>
  )
}
