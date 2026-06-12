import { STORAGE_KEYS } from "@/lib/storage-keys"

export type ReviewStats = {
  correct: number
  wrong: number
  repeated: number
}

const REVIEW_SESSION_SOURCE_KEYS = new Set<string>([
  STORAGE_KEYS.KANA_MASTERED,
  STORAGE_KEYS.VOCAB_LEARNED,
  STORAGE_KEYS.SRS_KANA,
  STORAGE_KEYS.SRS_VOCAB,
  STORAGE_KEYS.SRS_MISTAKES,
  STORAGE_KEYS.MISTAKES,
  STORAGE_KEYS.ITEM_PROGRESS,
  STORAGE_KEYS.PRACTICE_RESULTS,
])

export type ReviewCompletionStats = {
  initial: number
  answered: number
  correct: number
  repeated: number
}

export function createReviewStats(): ReviewStats {
  return { correct: 0, wrong: 0, repeated: 0 }
}

export function recordReviewAnswer(stats: ReviewStats, ok: boolean): ReviewStats {
  return {
    correct: stats.correct + (ok ? 1 : 0),
    wrong: stats.wrong + (ok ? 0 : 1),
    repeated: stats.repeated + (ok ? 0 : 1),
  }
}

export function advanceReviewQueue<T>(queue: T[], lastOk: boolean | null): T[] {
  const [head, ...rest] = queue
  if (!head) return queue
  if (lastOk === null) return queue
  return lastOk ? rest : [...rest, head]
}

export function dropCurrentReviewItem<T>(queue: T[]): T[] {
  const [, ...rest] = queue
  return rest
}

export function getReviewCompletionStats(initial: number, stats: ReviewStats): ReviewCompletionStats {
  return {
    initial,
    answered: stats.correct + stats.wrong,
    correct: stats.correct,
    repeated: stats.repeated,
  }
}

export function shouldInvalidateReviewSession(action: unknown, keys?: readonly unknown[]): boolean {
  if (action === "restore" || action === "reset") return true
  if (action === "backup" || action === "rollback") return false
  if (action !== "storage") return false
  if (!keys?.length) return false
  return keys.some((key) => typeof key === "string" && REVIEW_SESSION_SOURCE_KEYS.has(key))
}
