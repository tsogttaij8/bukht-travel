import { NextResponse } from "next/server"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"
import { readUsers } from "../../../../lib/server/user-store"

function ensureDeveloper(request: Request): NextResponse | null {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")

  if (!session || session.role !== "developer") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  return null
}

export async function GET(request: Request): Promise<NextResponse> {
  const denied = ensureDeveloper(request)
  if (denied) return denied

  return NextResponse.json({ users: await readUsers() }, { status: 200 })
}
