import OwnerTravelManager from "../../../../../components/owner/travel/OwnerTravelManager"
import OwnerWorkspaceShell from "../../../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../../../lib/server/role-guard"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditOwnerTravelTourPage({ params }: PageProps) {
  const session = await requireRole("owner")
  const { id } = await params

  return (
    <OwnerWorkspaceShell
      title="Edit tour"
      eyebrow="Travel"
      description="Update tour content using the real owner tour backend."
      user={{ name: session.name, email: session.email }}
    >
      <OwnerTravelManager mode="edit" tourId={id} />
    </OwnerWorkspaceShell>
  )
}
