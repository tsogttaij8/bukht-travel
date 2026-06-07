import Link from "next/link"
import OwnerTravelManager from "../../../components/owner/travel/OwnerTravelManager"
import OwnerWorkspaceShell from "../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../lib/server/role-guard"

export default async function OwnerTravelPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell
      title="Travel management"
      description="Manage tours, drafts, published packages, and customer previews."
      user={{ name: session.name, email: session.email }}
      action={<Link href="/owner/travel/tours/new" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white">New tour</Link>}
    >
      <OwnerTravelManager mode="dashboard" />
    </OwnerWorkspaceShell>
  )
}
