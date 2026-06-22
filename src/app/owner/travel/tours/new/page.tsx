import OwnerTravelManager from "@/src/app/owner/travel/_components/OwnerTravelManager"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { requireRole } from "../../../../../lib/server/role-guard"

export default async function NewOwnerTravelTourPage() {
  const session = await requireRole("owner")

  return (
    <OwnerWorkspaceShell
      title="Аялал үүсгэх"
      eyebrow="Аялал"
      description="Үүсгэсэн аялалаа ноороглоод дараа нь хүссэн үедээ нийтэлж болно"
      user={{ name: session.name, email: session.email }}
    >
      <OwnerTravelManager mode="new" />
    </OwnerWorkspaceShell>
  )
}
