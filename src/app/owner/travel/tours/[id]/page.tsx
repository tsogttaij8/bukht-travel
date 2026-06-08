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
      title="Аялал засах"
      eyebrow="Аялал"
      description="Owner аяллын backend дээр хадгалагдсан мэдээллийг шинэчилнэ."
      user={{ name: session.name, email: session.email }}
    >
      <OwnerTravelManager mode="edit" tourId={id} />
    </OwnerWorkspaceShell>
  )
}
