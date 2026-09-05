"use client"
import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

export function useItemDeepLink<T>(items: readonly T[], getId: (item: T) => string, openAt: (index: number) => void) {
  const params = useSearchParams()
  const requested = params.get("item")
  const handled = useRef<string | null>(null)
  useEffect(() => {
    if (!requested) { handled.current = null; return }
    if (handled.current === requested) return
    const index = items.findIndex(item => getId(item) === requested)
    if (index < 0) return
    const timer = setTimeout(() => { handled.current = requested; openAt(index) }, 0)
    return () => clearTimeout(timer)
  }, [requested, items, getId, openAt])
}
