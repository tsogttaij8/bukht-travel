"use client"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type ClerkTokenGetter = () => Promise<string | null>

export function createBrowserSupabase(getToken: ClerkTokenGetter): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    accessToken: getToken,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
