import { clerkMessage } from "./clerk-auth-utils"
import { syncClerkSession } from "../../lib/auth"

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForToken(getToken: () => Promise<string | null>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const token = await getToken()
    if (token) return token
    await wait(300)
  }
  throw new Error("SESSION_NOT_READY")
}

export async function syncActiveClerkSession(getToken: () => Promise<string | null>) {
  let lastResult: Awaited<ReturnType<typeof syncClerkSession>> | null = null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = await waitForToken(() => getToken())

    lastResult = await syncClerkSession(token)

    if (lastResult.ok) return lastResult

    if (lastResult.message !== "SESSION_NOT_READY") return lastResult

    await wait(300 * (attempt + 1))
  }

  return lastResult ?? { ok: false, message: "SESSION_NOT_READY" }
}

export function loginErrorMessage(error: unknown): string {
  const code = (error as { errors?: Array<{ code?: string }> })?.errors?.[0]?.code
  if (code === "form_identifier_not_found" || code === "form_password_incorrect") return "Мэйл эсвэл нууц үг буруу байна."
  if (error instanceof Error && (error.message === "SESSION_NOT_READY" || error.message === "SYNC_FAILED")) {
    return "Нэвтрэлт баталгаажсан ч session/database sync амжилтгүй боллоо. Дахин оролдоно уу."
  }
  return clerkMessage(error)
}
