import OwnerTravelManager from "../../../../../components/owner/travel/OwnerTravelManager"
import OwnerWorkspaceShell from "../../../../../components/owner/OwnerWorkspaceShell"
import { requireRole } from "../../../../../lib/server/role-guard"

export default async function NewOwnerTravelTourPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell
      title="Аялал үүсгэх"
      eyebrow="Аялал"
      description="Эхлээд ноорог аялал үүсгээд, бэлэн болсон үед нь нийтэлнэ."
      user={{ name: session.name, email: session.email }}
    >
      <OwnerTravelManager mode="new" />
    </OwnerWorkspaceShell>
  )
}
