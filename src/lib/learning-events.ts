"use client"

export const LEARNING_STORE_EVENT = "yasashi:learning-store:update"
export const LEARNING_STORE_CHANNEL = "yasashi:learning-store"

type QueuedLearningNotification = () => void
type LearningStoreEventDetail = { action: string; keys: readonly string[] }
type LearningStoreBroadcastDetail = LearningStoreEventDetail & { sourceId?: string }

let transactionDepth = 0
let queuedLearningNotifications: QueuedLearningNotification[] = []
const learningStoreSourceId = Math.random().toString(36).slice(2)

function normalizeLearningStoreEventDetail(value: unknown): LearningStoreEventDetail | null {
  if (!value || typeof value !== "object") return null
  const detail = value as Partial<LearningStoreBroadcastDetail>
  if (typeof detail.action !== "string" || !Array.isArray(detail.keys)) return null
  if (!detail.keys.every((key) => typeof key === "string")) return null
  return { action: detail.action, keys: detail.keys }
}

function getLearningBroadcastChannel() {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") return null
  try {
    return new window.BroadcastChannel(LEARNING_STORE_CHANNEL)
  } catch {
    return null
  }
}

export function notifyLearningStoreEvent(detail: LearningStoreEventDetail) {
  if (typeof window === "undefined") return

  window.dispatchEvent(new CustomEvent(LEARNING_STORE_EVENT, { detail }))

  const channel = getLearningBroadcastChannel()
  if (!channel) return
  try {
    channel.postMessage({ ...detail, sourceId: learningStoreSourceId } satisfies LearningStoreBroadcastDetail)
  } finally {
    channel.close()
  }
}

export function addLearningStoreListener(listener: (detail: LearningStoreEventDetail) => void) {
  if (typeof window === "undefined") return () => {}

  const onWindowEvent = (event: Event) => {
    const detail = normalizeLearningStoreEventDetail((event as CustomEvent).detail)
    if (!detail) return
    listener(detail)
  }

  const channel = getLearningBroadcastChannel()
  const onChannelMessage = (event: MessageEvent) => {
    const data = event.data as LearningStoreBroadcastDetail | undefined
    if (data?.sourceId === learningStoreSourceId) return
    const detail = normalizeLearningStoreEventDetail(data)
    if (!detail) return
    listener(detail)
  }

  window.addEventListener(LEARNING_STORE_EVENT, onWindowEvent)
  channel?.addEventListener("message", onChannelMessage)

  return () => {
    window.removeEventListener(LEARNING_STORE_EVENT, onWindowEvent)
    channel?.removeEventListener("message", onChannelMessage)
    channel?.close()
  }
}

export function queueLearningNotification(emit: QueuedLearningNotification) {
  if (typeof window === "undefined") return
  if (transactionDepth > 0) {
    queuedLearningNotifications.push(emit)
    return
  }
  emit()
}

export function beginLearningNotificationTransaction() {
  transactionDepth += 1
  return queuedLearningNotifications.length
}

export function endLearningNotificationTransaction() {
  transactionDepth = Math.max(0, transactionDepth - 1)
}

export function isOuterLearningNotificationTransaction() {
  return transactionDepth === 0
}

export function discardLearningNotificationsFrom(index: number) {
  queuedLearningNotifications.length = Math.max(0, index)
}

export function flushQueuedLearningNotifications() {
  const notifications = queuedLearningNotifications
  queuedLearningNotifications = []
  for (const emit of notifications) {
    try {
      emit()
    } catch {
      // A UI sync listener should not prevent later successful transaction notifications.
    }
  }
}
