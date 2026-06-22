import AdminCommerceDashboard from "../../../components/admin/commerce/AdminCommerceDashboard"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { listCommerceProducts, listCommercePurchaseRequests } from "../../../lib/server/commerce-store"
import { requireRole } from "../../../lib/server/role-guard"

export const dynamic = "force-dynamic"

export default async function AdminCommercePage() {
  const session = await requireRole("owner")
  const [products, requests] = await Promise.all([
    listCommerceProducts(),
    listCommercePurchaseRequests(),
  ])

  return (
    <OwnerWorkspaceShell title="Admin commerce" description="Manage all marketplace products and purchase requests." user={{ name: session.name, email: session.email }}>
      <AdminCommerceDashboard products={products} requests={requests} />
    </OwnerWorkspaceShell>
  )
}
