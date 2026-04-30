import { NextResponse } from "next/server"
import { readSessionFromCookieHeader, sessionHasRole } from "../../../../lib/server/session"
import { normalizeUserRoles, readUsers, updateUserAccess, upsertStaffUser, userRoles } from "../../../../lib/server/user-store"

function ensureOwner(request: Request) {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")

  if (!session || !sessionHasRole(session, "owner")) {
    return {
      denied: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
      session: null,
    }
  }

  return { denied: null, session }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateRoles(roles: unknown): string[] | null {
  if (!Array.isArray(roles)) return null
  const parsed = roles.filter((role): role is string => typeof role === "string")
  if (parsed.some((role) => !(userRoles as readonly string[]).includes(role))) return null
  return normalizeUserRoles(parsed)
}

export async function GET(request: Request): Promise<NextResponse> {
  const { denied } = ensureOwner(request)
  if (denied) return denied

  return NextResponse.json({ users: await readUsers() }, { status: 200 })
}

export async function POST(request: Request): Promise<NextResponse> {
  const { denied, session } = ensureOwner(request)
  if (denied) return denied

  const body = (await request.json()) as {
    email?: string
    name?: string
    roles?: unknown
    status?: "active" | "disabled"
  }

  const email = body.email?.trim().toLowerCase() ?? ""
  const name = body.name?.trim() ?? ""
  const roles = validateRoles(body.roles)

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ message: "Зөв имэйл оруулна уу" }, { status: 400 })
  }

  if (!name) {
    return NextResponse.json({ message: "Нэр оруулна уу" }, { status: 400 })
  }

  if (!roles) {
    return NextResponse.json({ message: "Role сонголт буруу байна" }, { status: 400 })
  }

  if (session && email === session.email && !roles.includes("owner")) {
    return NextResponse.json({ message: "Өөрийн owner эрхийг хасаж болохгүй" }, { status: 400 })
  }

  const user = await upsertStaffUser({
    email,
    name,
    roles,
    status: body.status,
  })

  return NextResponse.json({ user }, { status: 200 })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const { denied, session } = ensureOwner(request)
  if (denied) return denied

  const body = (await request.json()) as {
    userId?: string
    name?: string
    roles?: unknown
    status?: "active" | "disabled"
  }

  const userId = body.userId?.trim() ?? ""
  const roles = validateRoles(body.roles)
  const status = body.status === "disabled" ? "disabled" : "active"

  if (!userId) {
    return NextResponse.json({ message: "userId шаардлагатай" }, { status: 400 })
  }

  if (!roles) {
    return NextResponse.json({ message: "Role сонголт буруу байна" }, { status: 400 })
  }

  const users = await readUsers()
  const target = users.find((user) => user.id === userId)
  if (!target) {
    return NextResponse.json({ message: "Хэрэглэгч олдсонгүй" }, { status: 404 })
  }

  if (session && target.email === session.email && (!roles.includes("owner") || status === "disabled")) {
    return NextResponse.json({ message: "Өөрийн owner эрхийг хасах эсвэл өөрийгөө идэвхгүй болгох боломжгүй" }, { status: 400 })
  }

  const user = await updateUserAccess({
    userId,
    name: body.name,
    roles,
    status,
  })

  if (!user) {
    return NextResponse.json({ message: "Хэрэглэгч олдсонгүй" }, { status: 404 })
  }

  return NextResponse.json({ user }, { status: 200 })
}
