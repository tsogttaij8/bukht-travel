"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import AppLoader from "./AppLoader"
import { LOADING_REVEAL_DELAY_MS } from "./loading-config"

type NavigationTransaction = {
  id: number
  destination: string
}

type NavigationLoadingContextValue = {
  beginNavigation: (destination: string) => boolean
  registerRouteBoundary: () => () => void
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null)

function locationKey(pathname: string, search: string): string {
  return `${pathname}${search ? `?${search}` : ""}`
}

function internalDestination(destination: string): string | null {
  try {
    const url = new URL(destination, window.location.href)
    if (url.origin !== window.location.origin) return null
    return locationKey(url.pathname, url.searchParams.toString())
  } catch {
    return null
  }
}

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const committedLocationRef = useRef("")
  const transactionId = useRef(0)
  const currentTransaction = useRef<NavigationTransaction | null>(null)
  const routeBoundaries = useRef(new Set<number>())
  const boundaryId = useRef(0)
  const commitTimer = useRef<number | null>(null)
  const [transaction, setTransaction] = useState<NavigationTransaction | null>(null)
  const [boundaryCount, setBoundaryCount] = useState(0)
  const [showLoader, setShowLoader] = useState(false)
  const pending = transaction !== null || boundaryCount > 0

  const clearTransaction = useCallback((id?: number) => {
    const current = currentTransaction.current
    if (!current || (id !== undefined && current.id !== id)) return
    currentTransaction.current = null
    setTransaction(null)
  }, [])

  const beginNavigation = useCallback((destination: string): boolean => {
    const expected = internalDestination(destination)
    if (!expected) return false

    const committed = committedLocationRef.current || locationKey(window.location.pathname, window.location.search.slice(1))
    if (expected === committed) return false

    const next = { id: ++transactionId.current, destination: expected }
    currentTransaction.current = next
    setTransaction(next)
    return true
  }, [])

  const registerRouteBoundary = useCallback(() => {
    const id = ++boundaryId.current
    routeBoundaries.current.add(id)
    setBoundaryCount(routeBoundaries.current.size)

    return () => {
      routeBoundaries.current.delete(id)
      setBoundaryCount(routeBoundaries.current.size)
    }
  }, [])

  const handleRouteCommit = useCallback((location: string) => {
    committedLocationRef.current = location
    const current = currentTransaction.current
    if (!current || current.destination !== location) return
    if (commitTimer.current !== null) window.clearTimeout(commitTimer.current)
    commitTimer.current = window.setTimeout(() => clearTransaction(current.id), 0)
  }, [clearTransaction])

  useEffect(() => () => {
    if (commitTimer.current !== null) window.clearTimeout(commitTimer.current)
  }, [])

  useEffect(() => {
    if (!pending) {
      const timer = window.setTimeout(() => setShowLoader(false), 0)
      return () => window.clearTimeout(timer)
    }

    const activeId = currentTransaction.current?.id
    const timer = window.setTimeout(() => {
      if (boundaryCount > 0 || currentTransaction.current?.id === activeId) setShowLoader(true)
    }, LOADING_REVEAL_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [boundaryCount, pending, transaction?.id])

  useEffect(() => {
    const handlePopState = () => beginNavigation(window.location.href)
    const handleNavigationFailure = () => clearTransaction()
    const handlePageShow = () => clearTransaction()

    window.addEventListener("popstate", handlePopState)
    window.addEventListener("error", handleNavigationFailure)
    window.addEventListener("unhandledrejection", handleNavigationFailure)
    window.addEventListener("pageshow", handlePageShow)
    return () => {
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("error", handleNavigationFailure)
      window.removeEventListener("unhandledrejection", handleNavigationFailure)
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [beginNavigation, clearTransaction])

  const value = useMemo(() => ({ beginNavigation, registerRouteBoundary }), [beginNavigation, registerRouteBoundary])

  return (
    <NavigationLoadingContext.Provider value={value}>
      <Suspense fallback={null}>
        <NavigationCommitObserver onCommit={handleRouteCommit} />
      </Suspense>
      {children}
      {showLoader && pending ? <AppLoader label="Page loading" /> : null}
    </NavigationLoadingContext.Provider>
  )
}

function NavigationCommitObserver({ onCommit }: { onCommit: (location: string) => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const committedLocation = locationKey(pathname, searchParams.toString())

  useEffect(() => {
    onCommit(committedLocation)
  }, [committedLocation, onCommit])

  return null
}

export function useNavigationLoading(): NavigationLoadingContextValue {
  const context = useContext(NavigationLoadingContext)
  if (!context) throw new Error("useNavigationLoading must be used inside NavigationLoadingProvider.")
  return context
}
