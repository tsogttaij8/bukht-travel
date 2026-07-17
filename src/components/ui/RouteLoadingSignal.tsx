"use client"

import { useEffect } from "react"
import { useNavigationLoading } from "./NavigationLoadingProvider"

export default function RouteLoadingSignal() {
  const { registerRouteBoundary } = useNavigationLoading()

  useEffect(() => registerRouteBoundary(), [registerRouteBoundary])
  return null
}
