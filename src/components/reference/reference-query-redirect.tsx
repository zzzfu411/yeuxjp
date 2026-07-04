"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { shouldUsePwaDocumentNavigationForHref } from "@/lib/pwa-navigation"

interface ReferenceQueryRedirectProps {
  basePath: string
  validIds: readonly string[]
}

export function ReferenceQueryRedirect({ basePath, validIds }: ReferenceQueryRedirectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const itemId = searchParams.get("item")
    if (!itemId || !validIds.includes(itemId)) return

    const targetHref = `${basePath}/${encodeURIComponent(itemId)}`
    if (shouldUsePwaDocumentNavigationForHref({
      href: targetHref,
      currentLocation: window.location,
      isOnline: navigator.onLine,
      hasServiceWorkerController: "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller),
    })) {
      window.location.replace(targetHref)
      return
    }

    router.replace(targetHref)
  }, [basePath, router, searchParams, validIds])

  return null
}
