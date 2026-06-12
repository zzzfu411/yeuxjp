"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/ui/modal"
import { shouldHandleGlobalShortcutEvent } from "@/lib/keyboard-shortcuts"

interface UrlControlledReferenceModalProps {
  children: ReactNode
  className?: string
  closeHref: string
  nextHref: string
  prevHref: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

export function UrlControlledReferenceModal({
  children,
  className,
  closeHref,
  nextHref,
  prevHref,
  ariaLabelledBy,
  ariaDescribedBy,
}: UrlControlledReferenceModalProps) {
  const router = useRouter()

  const close = useCallback(() => {
    router.push(closeHref)
  }, [closeHref, router])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldHandleGlobalShortcutEvent(event)) return

      if (event.key === "ArrowRight") {
        event.preventDefault()
        router.push(nextHref)
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        router.push(prevHref)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextHref, prevHref, router])

  return (
    <Modal
      isOpen
      onClose={close}
      className={className}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
    >
      {children}
    </Modal>
  )
}
