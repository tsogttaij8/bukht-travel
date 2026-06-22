import Link from "next/link"
import OwnerCommerceDashboard from "@/src/app/owner/shop/_components/OwnerCommerceDashboard"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { listCommerceProducts, listCommercePurchaseRequests } from "../../../lib/server/commerce-store"
import { requireRole } from "../../../lib/server/role-guard"

export const dynamic = "force-dynamic"

export default async function OwnerCommercePage() {
  const session = await requireRole("owner")
  const ownerId = `email:${session.email.trim().toLowerCase()}`
  const [products, requests] = await Promise.all([
    listCommerceProducts({ ownerId }),
    listCommercePurchaseRequests(),
  ])

  return (
    <OwnerWorkspaceShell
      title="Худалдаа"
      description=""
      user={{ name: session.name, email: session.email }}
      action={<Link href="/owner/commerce/products/new" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white">Бараа нэмэх</Link>}
    >
      <OwnerCommerceDashboard products={products} requests={requests} />
    </OwnerWorkspaceShell>
  )
}
