import Link from "next/link"
import OwnerTravelManager from "@/src/app/owner/travel/_components/OwnerTravelManager"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { requireRole } from "../../../../lib/server/role-guard"

export default async function OwnerTravelToursPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell
      title="Аяллууд"
      eyebrow="Аялал"
      description="Owner-ийн бодит аяллын мэдээллийг хүснэгтээр удирдана."
      user={{ name: session.name, email: session.email }}
      action={<Link href="/owner/travel/tours/new" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white">Шинэ аялал</Link>}
    >
      <OwnerTravelManager mode="tours" />
    </OwnerWorkspaceShell>
  )
}
