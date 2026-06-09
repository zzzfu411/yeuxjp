import { kanaData, type Kana } from "@/data/kana-data"
import type { Vocabulary } from "@/data/vocabulary/types"
import type { KanaQuizScope } from "@/lib/quiz-types"

export function getKanaPool(scope: KanaQuizScope) {
  return scope === "all" ? kanaData : kanaData.filter((k) => k.type === "seion")
}

export function filterUnmasteredKana(pool: Kana[], isMastered: (id: string) => boolean, onlyUnmastered: boolean) {
  if (!onlyUnmastered) return pool
  return pool.filter((k) => !isMastered(k.romaji))
}

export function filterUnlearnedVocab(pool: Vocabulary[], isLearned: (id: string) => boolean, onlyUnlearned: boolean) {
  if (!onlyUnlearned) return pool
  return pool.filter((v) => !isLearned(v.id))
}
