import Link from "next/link"
import OwnerTravelManager from "../../../../components/owner/travel/OwnerTravelManager"
import OwnerWorkspaceShell from "../../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../../lib/server/role-guard"

export default async function OwnerTravelToursPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell
      title="Tours"
      eyebrow="Travel"
      description="Table-based tour management from real owner tour data."
      user={{ name: session.name, email: session.email }}
      action={<Link href="/owner/travel/tours/new" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white">New tour</Link>}
    >
      <OwnerTravelManager mode="tours" />
    </OwnerWorkspaceShell>
  )
}
