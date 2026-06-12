"use client"

import { RefreshCw, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { warnInDevelopment } from "@/lib/dev-log"

export const PWA_UPDATE_READY_EVENT = "yasashi:pwa-update-ready"

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
  const [refreshing, setRefreshing] = useState(false)
  const waitingRegistrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const refreshAfterControllerChangeRef = useRef(false)

  useEffect(() => {
    let hasExistingController = "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller)

    const markUpdateReady = (registration?: ServiceWorkerRegistration | null) => {
      if (registration?.waiting) {
        waitingRegistrationRef.current = registration
      }
      if (hasExistingController && navigator.serviceWorker.controller) {
        setUpdateReady(true)
        setDismissed(false)
        setRefreshing(false)
      }
    }

    const onControllerChange = () => {
      if (!hasExistingController) {
        hasExistingController = true
        return
      }

      if (refreshAfterControllerChangeRef.current) {
        window.location.reload()
        return
      }

      markUpdateReady()
    }

    const onUpdateReadyEvent = () => {
      setUpdateReady(true)
      setDismissed(false)
    }

    const onOfflineLinkClick = (event: MouseEvent) => {
      if (navigator.onLine) return

      const anchor = getOfflineNavigationAnchor(event)
      if (!anchor) return

      event.preventDefault()
      event.stopPropagation()
      window.location.assign(anchor.href)
    }

    const enableTestUpdateEvent = process.env.NODE_ENV !== "production"
    if (enableTestUpdateEvent) {
      window.addEventListener(PWA_UPDATE_READY_EVENT, onUpdateReadyEvent)
    }

    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return () => {
        if (enableTestUpdateEvent) {
          window.removeEventListener(PWA_UPDATE_READY_EVENT, onUpdateReadyEvent)
        }
      }
    }

    document.addEventListener("click", onOfflineLinkClick, true)
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) {
        markUpdateReady(registration)
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing
        if (!worker) return

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") {
            markUpdateReady(registration)
          }
        })
      })
    }).catch((error) => {
      warnInDevelopment("[pwa] Failed to register service worker:", error)
    })

    return () => {
      if (enableTestUpdateEvent) {
        window.removeEventListener(PWA_UPDATE_READY_EVENT, onUpdateReadyEvent)
      }
      document.removeEventListener("click", onOfflineLinkClick, true)
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  const activateWaitingUpdate = () => {
    const waitingWorker = waitingRegistrationRef.current?.waiting

    if (!waitingWorker) {
      window.location.reload()
      return
    }

    refreshAfterControllerChangeRef.current = true
    setRefreshing(true)
    waitingWorker.postMessage({ type: "SKIP_WAITING" })

    window.setTimeout(() => {
      if (refreshAfterControllerChangeRef.current) {
        window.location.reload()
      }
    }, 5_000)
  }

  if (!updateReady || dismissed) return null

  return (
    <div
      aria-label="应用更新"
      aria-live="polite"
      role="region"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-md border bg-card p-3 text-card-foreground shadow-lg sm:inset-x-auto sm:right-4 sm:left-auto"
      data-testid="pwa-update-banner"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5">新版本已准备好</p>
        <p className="text-xs leading-5 text-muted-foreground">刷新后可同步最新离线文件。</p>
      </div>
      <Button
        className="shrink-0 gap-2"
        data-testid="pwa-update-refresh"
        disabled={refreshing}
        onClick={activateWaitingUpdate}
        size="sm"
        type="button"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {refreshing ? "更新中" : "刷新"}
      </Button>
      <Button
        aria-label="关闭更新提示"
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
