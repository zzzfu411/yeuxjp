"use client"

import { RefreshCw, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

function getOfflineNavigationAnchor(event: MouseEvent) {
  if (event.defaultPrevented) return null
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  if (!(event.target instanceof Element)) return null

  const anchor = event.target.closest<HTMLAnchorElement>("a[href]")
  if (!anchor) return null
  if (anchor.hasAttribute("download")) return null
  if (anchor.target && anchor.target !== "_self") return null

  const href = anchor.getAttribute("href")
  if (!href || href.startsWith("#")) return null

  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return null
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return null

  return anchor
}

export function PwaRegister() {
  const [updateReady, setUpdateReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    let hasExistingController = Boolean(navigator.serviceWorker.controller)

    const markUpdateReady = () => {
      if (hasExistingController && navigator.serviceWorker.controller) {
        setUpdateReady(true)
        setDismissed(false)
      }
    }

    const onControllerChange = () => {
      if (!hasExistingController) {
        hasExistingController = true
        return
      }
      markUpdateReady()
    }

    const onOfflineLinkClick = (event: MouseEvent) => {
      if (navigator.onLine) return

      const anchor = getOfflineNavigationAnchor(event)
      if (!anchor) return

      event.preventDefault()
      event.stopPropagation()
      window.location.assign(anchor.href)
    }

    document.addEventListener("click", onOfflineLinkClick, true)
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) {
        markUpdateReady()
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing
        if (!worker) return

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") {
            markUpdateReady()
          }
        })
      })
    }).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[pwa] Failed to register service worker:", error)
      }
    })

    return () => {
      document.removeEventListener("click", onOfflineLinkClick, true)
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  if (!updateReady || dismissed) return null

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-md border bg-card p-3 text-card-foreground shadow-lg sm:inset-x-auto sm:right-4 sm:left-auto"
      data-testid="pwa-update-banner"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5">New version ready</p>
        <p className="text-xs leading-5 text-muted-foreground">Refresh to keep offline files in sync.</p>
      </div>
      <Button
        className="shrink-0 gap-2"
        data-testid="pwa-update-refresh"
        onClick={() => window.location.reload()}
        size="sm"
        type="button"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Refresh
      </Button>
      <Button
        aria-label="Dismiss update notice"
        className="h-8 w-8 shrink-0"
        data-testid="pwa-update-dismiss"
        onClick={() => setDismissed(true)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
