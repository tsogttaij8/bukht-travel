import OwnerTravelManager from "../../../../../components/owner/travel/OwnerTravelManager"
import OwnerWorkspaceShell from "../../../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../../../lib/server/role-guard"

export default async function NewOwnerTravelTourPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell
      title="Create tour"
      eyebrow="Travel"
      description="Create a draft tour, then publish it when ready."
      user={{ name: session.name, email: session.email }}
    >
      <OwnerTravelManager mode="new" />
    </OwnerWorkspaceShell>
  )
}
