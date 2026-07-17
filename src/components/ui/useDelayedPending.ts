"use client"

import { useEffect, useState } from "react"
import { LOADING_REVEAL_DELAY_MS } from "./loading-config"

export function useDelayedPending(pending: boolean): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(pending),
      pending ? LOADING_REVEAL_DELAY_MS : 0,
    )
    return () => window.clearTimeout(timer)
  }, [pending])

  return pending && visible
}
