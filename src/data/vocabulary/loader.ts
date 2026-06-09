import type { VocabLevel, Vocabulary } from "./types"
import { getVocabLevelForId } from "./stats"

export async function loadVocabularyLevel(level: VocabLevel): Promise<Vocabulary[]> {
  if (level === "survival") return (await import("./survival")).survivalVocab
  if (level === "daily") return (await import("./daily")).dailyVocab
  return (await import("./fluent")).fluentVocab
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
  return chunks.flat()
}
