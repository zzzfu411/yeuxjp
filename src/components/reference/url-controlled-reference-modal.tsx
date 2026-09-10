"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/ui/modal"
import { shouldHandleModalArrowNavigation } from "@/lib/modal-arrow-navigation"
import { shouldUsePwaDocumentNavigationForHref } from "@/lib/pwa-navigation"

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

  const navigate = useCallback((href: string) => {
    if (shouldUsePwaDocumentNavigationForHref({
      href,
      currentLocation: window.location,
      isOnline: navigator.onLine,
      hasServiceWorkerController: "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller),
    })) {
      window.location.assign(href)
      return
    }

    router.push(href)
  }, [router])

  const close = useCallback(() => {
    navigate(closeHref)
  }, [closeHref, navigate])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = shouldHandleModalArrowNavigation(event, "url-controlled-reference")
      if (direction === "ArrowRight") {
        event.preventDefault()
        navigate(nextHref)
      }
      if (direction === "ArrowLeft") {
        event.preventDefault()
        navigate(prevHref)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate, nextHref, prevHref])

  return (
    <Modal
      isOpen
      onClose={close}
      className={className}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
      stackKey="url-controlled-reference"
    >
      {children}
    </Modal>
  )
}
