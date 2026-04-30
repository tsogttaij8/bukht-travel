import { redirect } from "next/navigation"
import { roleHomePath } from "../../lib/role-path"
import { requireAnyStaffRole } from "../../lib/server/role-guard"

export default async function DeveloperPage() {
  const session = await requireAnyStaffRole()
  redirect(roleHomePath(session.roles))
}
