"use client"

import { setLearningWriteLockHeld } from "@/lib/learning-write-lock-state"
import { LEARNING_WRITE_EPOCH_KEY } from "@/lib/storage-keys"

export const LEARNING_WRITE_LOCK_NAME = "yasashi:learning:write:v1"
export const LEARNING_WRITE_ERROR_EVENT = "yasashi:learning-write:error"
type WriteFailure = "unsupported" | "busy" | "invalidated" | "failed"

function reportFailure(reason: WriteFailure) {
  window.dispatchEvent(new CustomEvent(LEARNING_WRITE_ERROR_EVENT, { detail: reason }))
  return false as const
}

/** Browser operation boundary. The callback must stay synchronous; nested work uses the storage transaction. */
export async function runLearningWrite<T>(commit: () => T, options: { replacesData?: boolean } = {}): Promise<T | false> {
  if (typeof window === "undefined") return false
  if (!navigator.locks?.request) return reportFailure("unsupported")
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10_000)
  try {
    const epoch = window.localStorage.getItem(LEARNING_WRITE_EPOCH_KEY)
    return await navigator.locks.request(LEARNING_WRITE_LOCK_NAME, { mode: "exclusive", signal: controller.signal }, () => {
      window.clearTimeout(timeout)
      if (window.localStorage.getItem(LEARNING_WRITE_EPOCH_KEY) !== epoch) return reportFailure("invalidated")
      setLearningWriteLockHeld(true)
      let replaced = false
      try {
        if (options.replacesData) {
          window.localStorage.setItem(LEARNING_WRITE_EPOCH_KEY, crypto.randomUUID())
          replaced = true
        }
        const result = commit()
        if (result instanceof Promise) throw new Error("Learning write callbacks must be synchronous")
        if (!result && replaced) restoreEpoch(epoch)
        return result
      } catch {
        if (replaced) restoreEpoch(epoch)
        return reportFailure("failed")
      } finally {
        setLearningWriteLockHeld(false)
      }
    })
  } catch {
    return reportFailure(controller.signal.aborted ? "busy" : "failed")
  } finally {
    window.clearTimeout(timeout)
  }
}

function restoreEpoch(epoch: string | null) {
  if (epoch === null) window.localStorage.removeItem(LEARNING_WRITE_EPOCH_KEY)
  else window.localStorage.setItem(LEARNING_WRITE_EPOCH_KEY, epoch)
}
