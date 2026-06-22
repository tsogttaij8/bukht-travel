import CommerceProductForm from "@/src/app/owner/shop/_components/CommerceProductForm"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { requireRole } from "../../../../../lib/server/role-guard"

export default async function NewCommerceProductPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell title="Бараа нэмэх" description="" user={{ name: session.name, email: session.email }}>
      <CommerceProductForm />
    </OwnerWorkspaceShell>
  )
}
