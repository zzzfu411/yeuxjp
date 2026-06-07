import type { VocabLevel, Vocabulary } from "./types"

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
