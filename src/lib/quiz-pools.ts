import { kanaData, type Kana } from "@/data/kana-data"
import type { VocabLevel, Vocabulary } from "@/data/vocabulary/types"
import type { KanaQuizScope, VocabQuizScope } from "@/lib/quiz-types"

export function getKanaPool(scope: KanaQuizScope) {
  return scope === "all" ? kanaData : kanaData.filter((k) => k.type === "seion")
}

export function filterUnmasteredKana(pool: Kana[], isMastered: (id: string) => boolean, onlyUnmastered: boolean) {
  if (!onlyUnmastered) return pool
  return pool.filter((k) => !isMastered(k.romaji))
}

export function getVocabPool(scope: VocabQuizScope, vocabByLevel: Record<VocabLevel, Vocabulary[]>, allVocab: Vocabulary[]) {
  return scope === "all" ? allVocab : vocabByLevel[scope]
}

export function filterUnlearnedVocab(pool: Vocabulary[], isLearned: (id: string) => boolean, onlyUnlearned: boolean) {
  if (!onlyUnlearned) return pool
  return pool.filter((v) => !isLearned(v.id))
}
