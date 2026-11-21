"use client"

import type { ReactNode } from "react"
import { Suspense, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Modal } from "@/components/ui/modal"
import { shouldHandleGlobalShortcutEvent } from "@/lib/keyboard-shortcuts"
import { shouldUsePwaDocumentNavigationForHref } from "@/lib/pwa-navigation"
import { readReferenceCatalogState, referenceContextHref, type ReferenceCatalogState } from "@/lib/reference-catalog-model"
import { ReferenceContext, ReferenceContextLink } from "@/components/reference/reference-context-link"

interface UrlControlledReferenceModalProps {
  children: ReactNode
  className?: string
  closeHref: string
  nextHref: string
  prevHref: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  presentation?: "modal" | "page"
  backLabel?: string
}

export function UrlControlledReferenceModal(props: UrlControlledReferenceModalProps) {
  return <Suspense fallback={<ReferenceSurface {...props} context={{ query: "", page: 1 }} />}>
    <ConnectedReferenceSurface {...props} />
  </Suspense>
}

function ConnectedReferenceSurface(props: UrlControlledReferenceModalProps) {
  const params = useSearchParams()
  return <ReferenceSurface {...props} context={readReferenceCatalogState(params)} />
}

function ReferenceSurface({
  children,
  className,
  closeHref,
  nextHref,
  prevHref,
  ariaLabelledBy,
  ariaDescribedBy,
  presentation = "modal",
  backLabel = "返回列表",
  context,
}: UrlControlledReferenceModalProps & { context: ReferenceCatalogState }) {
  const router = useRouter()

  const navigate = useCallback((href: string) => {
    href = referenceContextHref(href, context)
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
  }, [context, router])

  const close = useCallback(() => {
    navigate(closeHref)
  }, [closeHref, navigate])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Page readers must not intercept keys intended for a settings or glossary dialog.
      if (presentation === "page" && document.querySelector('[role="dialog"]')) return
      if (!shouldHandleGlobalShortcutEvent(event)) return

      if (presentation === "page" && event.key === "Escape") {
        event.preventDefault()
        navigate(closeHref)
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        navigate(nextHref)
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        navigate(prevHref)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeHref, navigate, nextHref, presentation, prevHref])

  if (presentation === "page") {
    return <ReferenceContext.Provider value={context}>
      <nav aria-label="返回参考目录" className="mb-6">
        <ReferenceContextLink href={closeHref} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline underline-offset-4" data-testid="reference-back">← {backLabel}</ReferenceContextLink>
      </nav>
      <article className={className} aria-labelledby={ariaLabelledBy} data-testid="reference-document">
        {children}
      </article>
    </ReferenceContext.Provider>
  }

  return (
    <ReferenceContext.Provider value={context}><Modal
      isOpen
      onClose={close}
      className={className}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
    >
      {children}
    </Modal></ReferenceContext.Provider>
  )
}
