import { NextResponse } from "next/server"
import { createRoleInvite } from "../../../../lib/server/role-invite-store"
import { readSessionFromCookieHeader, sessionHasRole } from "../../../../lib/server/session"
import { sendRoleInviteEmail } from "../../../../lib/server/mailer"
import { findUserByEmail, normalizeUserRoles, userRoles } from "../../../../lib/server/user-store"

function ensureOwner(request: Request) {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  if (!session || !sessionHasRole(session, "owner")) {
    return { denied: NextResponse.json({ message: "Forbidden" }, { status: 403 }), session: null }
  }
  return { denied: null, session }
}

function validateRoles(roles: unknown): string[] | null {
  if (!Array.isArray(roles)) return null
  const parsed = roles.filter((role): role is string => typeof role === "string")
  if (parsed.some((role) => !(userRoles as readonly string[]).includes(role))) return null
  return normalizeUserRoles(parsed)
}

export async function POST(request: Request): Promise<NextResponse> {
  const { denied, session } = ensureOwner(request)
  if (denied || !session) return denied!

  const body = (await request.json()) as { email?: string; roles?: unknown }
  const email = body.email?.trim().toLowerCase() ?? ""
  const roles = validateRoles(body.roles)
  if (!email || !roles) return NextResponse.json({ message: "Хэрэглэгч болон role сонгоно уу" }, { status: 400 })

  const targetUser = await findUserByEmail(email)
  if (!targetUser) return NextResponse.json({ message: "Энэ email-ээр бүртгэлтэй хэрэглэгч олдсонгүй" }, { status: 404 })
  if (targetUser.status === "disabled") return NextResponse.json({ message: "Энэ хэрэглэгч disabled байна" }, { status: 400 })

  const invite = await createRoleInvite({ email, roles, invitedByEmail: session.email })
  const inviteUrl = new URL(`/invite/${invite.token}`, request.url).toString()
  const delivery = await sendRoleInviteEmail(email, inviteUrl, roles)

  return NextResponse.json({ invite, delivery, inviteUrl: delivery.mode === "dev" ? inviteUrl : undefined }, { status: 201 })
}
