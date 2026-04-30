export type AppRole = "owner" | "cargo_staff" | "travel_staff" | "esim_staff" | "finance_staff" | "support_staff" | "customer"

export function roleHomePath(roles: string[] | undefined): string {
  const roleSet = new Set(roles ?? [])

  if (roleSet.has("owner")) return "/owner"
  if (roleSet.has("cargo_staff")) return "/staff/cargo"
  if (roleSet.has("travel_staff")) return "/staff/travel"
  if (roleSet.has("esim_staff")) return "/staff/esim"
  if (roleSet.has("finance_staff")) return "/staff/finance"
  if (roleSet.has("support_staff")) return "/staff/support"

  return "/account"
}

