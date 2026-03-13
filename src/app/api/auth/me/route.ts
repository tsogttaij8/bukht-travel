import { NextResponse } from "next/server"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"

export async function GET(request: Request): Promise<NextResponse> {
  const payload = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  return NextResponse.json({ user: { name: payload.name, email: payload.email, role: payload.role } }, { status: 200 })
}
