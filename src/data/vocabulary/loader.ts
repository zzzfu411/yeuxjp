import type { VocabLevel, Vocabulary } from "./types"
import { getVocabLevelForId } from "./stats"

const vocabularyLevelLoaders: Record<VocabLevel, () => Promise<Vocabulary[]>> = {
  survival: () => import("./survival").then((module) => module.survivalVocab),
  daily: () => import("./daily").then((module) => module.dailyVocab),
  fluent: () => import("./fluent").then((module) => module.fluentVocab),
}

const vocabularyLevelPromises = new Map<VocabLevel, Promise<Vocabulary[]>>()

type VocabularyLoadFailureWindow = Window & {
  __yasashiE2EVocabularyLoadFailures?: Partial<Record<VocabLevel, number>>
}

function consumeE2EVocabularyLoadFailure(level: VocabLevel) {
  if (typeof window === "undefined") return null
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return null

  const failures = (window as VocabularyLoadFailureWindow).__yasashiE2EVocabularyLoadFailures
  if (!failures) return null

  const remaining = failures?.[level] ?? 0
  if (remaining <= 0) return null

  failures[level] = remaining - 1
  return new Error(`E2E simulated vocabulary load failure: ${level}`)
}

export function loadVocabularyLevel(level: VocabLevel): Promise<Vocabulary[]> {
  const cached = vocabularyLevelPromises.get(level)
  if (cached) return cached

  const promise = Promise.resolve()
    .then(() => {
      const simulatedFailure = consumeE2EVocabularyLoadFailure(level)
      if (simulatedFailure) throw simulatedFailure
      return vocabularyLevelLoaders[level]()
    })
    .catch((error) => {
      vocabularyLevelPromises.delete(level)
      throw error
    })
  vocabularyLevelPromises.set(level, promise)
  return promise
}

export async function loadVocabularyScope(scope: VocabLevel | "all"): Promise<Vocabulary[]> {
  if (scope !== "all") return loadVocabularyLevel(scope)
  const [survival, daily, fluent] = await Promise.all([
    loadVocabularyLevel("survival"),
    loadVocabularyLevel("daily"),
    loadVocabularyLevel("fluent"),
  ])
  return [...survival, ...daily, ...fluent]
}

export async function loadVocabularyForIds(ids: readonly string[]): Promise<Vocabulary[]> {
  const levels = Array.from(
    new Set(ids.map(getVocabLevelForId).filter((level): level is VocabLevel => level != null))
  )

  const chunks = await Promise.all(levels.map(loadVocabularyLevel))
  const byId = new Map(chunks.flat().map((item) => [item.id, item]))
  const seen = new Set<string>()
  const entries: Vocabulary[] = []

  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    const item = byId.get(id)
    if (item) entries.push(item)
  }

  return entries
}

export async function loadVocabularyReviewPool(ids: readonly string[], minSize: number = 4): Promise<Vocabulary[]> {
  const targets = await loadVocabularyForIds(ids)
  if (!targets.length || targets.length >= minSize) return targets

  const levels = Array.from(new Set(targets.map((item) => item.level)))
  const chunks = await Promise.all(levels.map(loadVocabularyLevel))
  const seen = new Set(targets.map((item) => item.id))
  const pool = [...targets]

  for (const item of chunks.flat()) {
    if (pool.length >= minSize) break
    if (seen.has(item.id)) continue
    seen.add(item.id)
    pool.push(item)
  }

  return pool
}
