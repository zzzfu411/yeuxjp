"use client"
import { useCallback, useEffect, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { LEARNING_EVENT, writeLearningJson } from "@/lib/learning-storage"
import { isProfileStorageKey } from "@/lib/learning-progress-keys"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readUserProfileResult } from "@/lib/learning-progress-storage"
import type { UserProfile } from "@/lib/learning-progress-model"

function readUserProfile() {
  return readUserProfileResult().value
}

export function useLearningProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setProfileState(readUserProfile())
      setLoaded(true)
    })

    const sync = (event: Event) => {
      const detail = (event as CustomEvent).detail as { key?: string } | undefined
      if (!isProfileStorageKey(detail?.key)) return
      setProfileState(readUserProfile())
    }

    const syncStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(STORAGE_KEYS.USER_PROFILE)) return
      setProfileState(readUserProfile())
    }

    const onStorage = (event: StorageEvent) => {
      if (!isProfileStorageKey(event.key)) return
      setProfileState(readUserProfile())
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(LEARNING_EVENT, sync)
    window.addEventListener(LEARNING_STORE_EVENT, syncStore)
    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(LEARNING_EVENT, sync)
      window.removeEventListener(LEARNING_STORE_EVENT, syncStore)
    }
  }, [])

  const saveProfile = useCallback((input: Omit<UserProfile, "createdAt" | "updatedAt">) => {
    const now = Date.now()
    const currentResult = readUserProfileResult()
    if (!currentResult.ok) return false
    const current = currentResult.value
    const next: UserProfile = {
      ...input,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }
    if (!writeLearningJson(STORAGE_KEYS.USER_PROFILE, next, { expectedRaw: currentResult.raw })) return false
    setProfileState(next)
    return true
  }, [])

  return { profile, loaded, saveProfile }
}
