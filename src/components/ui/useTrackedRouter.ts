"use client"

import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useNavigationLoading } from "./NavigationLoadingProvider"

export function useTrackedRouter() {
  const router = useRouter()
  const { beginNavigation } = useNavigationLoading()

  return useMemo(() => ({
    ...router,
    push(href: string, options?: Parameters<typeof router.push>[1]) {
      beginNavigation(href)
      router.push(href, options)
    },
    replace(href: string, options?: Parameters<typeof router.replace>[1]) {
      beginNavigation(href)
      router.replace(href, options)
    },
  }), [beginNavigation, router])
}
