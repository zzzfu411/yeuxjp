"use client"

import { useCallback, useEffect, useState } from "react"
import { shouldHandleGlobalShortcutEvent } from "@/lib/keyboard-shortcuts"

export function useIndexedModalNavigation(itemCount: number) {
  const [rawSelectedIndex, setRawSelectedIndex] = useState<number | null>(null)
  const selectedIndex =
    rawSelectedIndex === null || itemCount <= 0 ? null : Math.min(rawSelectedIndex, itemCount - 1)

  const openAt = useCallback(
    (index: number) => {
      if (itemCount <= 0) return
      setRawSelectedIndex(Math.max(0, Math.min(index, itemCount - 1)))
    },
    [itemCount]
  )

  const close = useCallback(() => {
    setRawSelectedIndex(null)
  }, [])

  const goNext = useCallback(() => {
    if (selectedIndex === null || itemCount <= 0) return
    setRawSelectedIndex((selectedIndex + 1) % itemCount)
  }, [itemCount, selectedIndex])

  const goPrev = useCallback(() => {
    if (selectedIndex === null || itemCount <= 0) return
    setRawSelectedIndex((selectedIndex - 1 + itemCount) % itemCount)
  }, [itemCount, selectedIndex])

  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldHandleGlobalShortcutEvent(event)) return

      if (event.key === "ArrowRight") {
        event.preventDefault()
        goNext()
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goPrev()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev, selectedIndex])

  return {
    selectedIndex,
    selectedPosition: selectedIndex === null ? 0 : selectedIndex + 1,
    isOpen: selectedIndex !== null,
    openAt,
    close,
    goNext,
    goPrev,
  }
}
