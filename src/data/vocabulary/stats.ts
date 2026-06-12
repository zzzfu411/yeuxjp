import type { VocabLevel } from "./types"
import { getKnownVocabularyLevelForId } from "./id-registry"

export const vocabLevelCounts = {
  survival: 505,
  daily: 240,
  fluent: 195,
} satisfies Record<VocabLevel, number>

export type VocabLevelStat = {
  total: number
  done: number
  ratio: number
}

export function getVocabLevelForId(id: string): VocabLevel | null {
  return getKnownVocabularyLevelForId(id)
}

export function summarizeLearnedVocabIds(learnedIds: Iterable<string>): Record<VocabLevel, VocabLevelStat> {
  const doneByLevel = {
    survival: 0,
    daily: 0,
    fluent: 0,
  } satisfies Record<VocabLevel, number>

  for (const id of learnedIds) {
    const level = getVocabLevelForId(id)
    if (level) doneByLevel[level] += 1
  }

  return {
    survival: makeStat(doneByLevel.survival, vocabLevelCounts.survival),
    daily: makeStat(doneByLevel.daily, vocabLevelCounts.daily),
    fluent: makeStat(doneByLevel.fluent, vocabLevelCounts.fluent),
  }
}

function makeStat(done: number, total: number): VocabLevelStat {
  const clampedDone = Math.min(Math.max(done, 0), total)
  return {
    total,
    done: clampedDone,
    ratio: total ? clampedDone / total : 0,
  }
}
