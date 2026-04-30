export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    const parts = [
      typeof maybeError.message === "string" ? maybeError.message : "",
      typeof maybeError.details === "string" ? maybeError.details : "",
      typeof maybeError.hint === "string" ? maybeError.hint : "",
      typeof maybeError.code === "string" ? `code: ${maybeError.code}` : "",
    ].filter(Boolean)
    if (parts.length > 0) return parts.join(" | ")
  }
  return "Unknown error"
}

export function shouldFallbackToLocalDb(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase()
  return (
    message.includes("fetch failed") ||
    message.includes("getaddrinfo enotfound") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("network") ||
    message.includes("dns")
  )
}

