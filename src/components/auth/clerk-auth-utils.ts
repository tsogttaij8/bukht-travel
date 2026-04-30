export type AuthMode = "login" | "signup"
export type AuthStep = "form" | "verify"

export function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}

export function passwordMessage(password: string): string {
  const passed = Object.values(passwordChecks(password)).filter(Boolean).length
  if (!password) return "8+ тэмдэгт, үсэг, тоо, нэг тусгай тэмдэгт оруулна."
  if (passed === 4) return "Маш сайн нууц үг."
  return "Үсэг, тоо, тусгай тэмдэгтээ бүрдүүлнэ."
}

export function isStrongPassword(password: string): boolean {
  return Object.values(passwordChecks(password)).every(Boolean)
}

export function clerkMessage(error: unknown): string {
  const errors = (error as { errors?: Array<{ longMessage?: string; message?: string }> })?.errors
  return errors?.[0]?.longMessage ?? errors?.[0]?.message ?? (error instanceof Error ? error.message : "Алдаа гарлаа.")
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function loginTarget(nextPath: string | null): string {
  return nextPath && nextPath.startsWith("/") ? nextPath : "/"
}
