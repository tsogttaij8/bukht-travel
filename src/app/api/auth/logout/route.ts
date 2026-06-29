import { NextResponse } from "next/server"
import { sessionConfig } from "../../../../lib/server/session"

export const dynamic = "force-dynamic"

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true })

  response.cookies.set(sessionConfig.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  response.cookies.set(sessionConfig.logoutMarkerName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return response
}
