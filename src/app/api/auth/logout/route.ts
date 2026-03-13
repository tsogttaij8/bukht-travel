import { NextResponse } from "next/server"
import { sessionConfig } from "../../../../lib/server/session"

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true }, { status: 200 })

  response.cookies.set(sessionConfig.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return response
}
