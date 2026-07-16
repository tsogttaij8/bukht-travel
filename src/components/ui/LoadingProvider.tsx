"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import AppLoader from "./AppLoader"

type LoadingContextValue = {
  startLoading: () => void
  stopLoading: () => void
  runWithLoading: <T>(request: () => Promise<T>) => Promise<T>
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeRequests, setActiveRequests] = useState(0)

  const startLoading = useCallback(() => {
    setActiveRequests((count) => count + 1)
  }, [])

  const stopLoading = useCallback(() => {
    setActiveRequests((count) => Math.max(0, count - 1))
  }, [])

  const runWithLoading = useCallback(async <T,>(request: () => Promise<T>): Promise<T> => {
    startLoading()
    try {
      return await request()
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  const value = useMemo(() => ({ startLoading, stopLoading, runWithLoading }), [runWithLoading, startLoading, stopLoading])

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {activeRequests > 0 ? <AppLoader /> : null}
    </LoadingContext.Provider>
  )
}

export function useAppLoading(): LoadingContextValue {
  const context = useContext(LoadingContext)
  if (!context) throw new Error("useAppLoading must be used inside LoadingProvider.")
  return context
}
