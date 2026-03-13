export type UserRole = "user" | "developer"
export type LoginFlowMode = "register" | "login"

export type SessionUser = {
  name: string
  email: string
  role: UserRole
}

type ApiResult = { ok: true } | { ok: false; message: string }

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string }
    return body.message ?? fallback
  } catch {
    return fallback
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/me", { method: "GET", cache: "no-store" })

  if (!response.ok) return null

  try {
    const body = (await response.json()) as { user?: SessionUser | null }
    return body.user ?? null
  } catch {
    return null
  }
}

export async function sendLoginCode(
  email: string,
  name?: string,
  mode: LoginFlowMode = "login"
): Promise<{ ok: true; devCode?: string } | { ok: false; message: string }> {
  const response = await fetch("/api/auth/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, mode }),
  })

  if (!response.ok) {
    return { ok: false, message: await parseError(response, "Код илгээхэд алдаа гарлаа") }
  }

  try {
    const body = (await response.json()) as { devCode?: string }
    return { ok: true, devCode: body.devCode }
  } catch {
    return { ok: true }
  }
}

export async function verifyLoginCode(email: string, code: string): Promise<ApiResult> {
  const response = await fetch("/api/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  })

  if (!response.ok) {
    return { ok: false, message: await parseError(response, "Нэвтрэхэд алдаа гарлаа") }
  }

  return { ok: true }
}

export async function logoutUser(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
}
