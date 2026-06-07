"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[pwa] Failed to register service worker:", error)
      }
    })
  }, [])

  return null
}
