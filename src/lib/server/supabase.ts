import { createClient, type SupabaseClient } from "@supabase/supabase-js"

declare global {
  var __buhktSupabaseAdmin: SupabaseClient | undefined
}

export function isSupabaseEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase env vars are missing")
  }

  if (!globalThis.__buhktSupabaseAdmin) {
    globalThis.__buhktSupabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return globalThis.__buhktSupabaseAdmin
}
