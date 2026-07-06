import type { VocabLevel } from "./types"
import { getKnownVocabularyLevelForId } from "./id-registry"
import { mapVocabularyLevels, vocabLevelCounts } from "./levels"

export { vocabLevelCounts } from "./levels"

export type VocabLevelStat = {
  total: number
  done: number
  ratio: number
}

export function getVocabLevelForId(id: string): VocabLevel | null {
  return getKnownVocabularyLevelForId(id)
}

export function summarizeLearnedVocabIds(learnedIds: Iterable<string>): Record<VocabLevel, VocabLevelStat> {
  const doneByLevel = mapVocabularyLevels(() => 0)

  for (const id of learnedIds) {
    const level = getVocabLevelForId(id)
    if (level) doneByLevel[level] += 1
  }

  return mapVocabularyLevels((level) => makeStat(doneByLevel[level], vocabLevelCounts[level]))
}

function makeStat(done: number, total: number): VocabLevelStat {
  const clampedDone = Math.min(Math.max(done, 0), total)
  return {
    total,
    done: clampedDone,
    ratio: total ? clampedDone / total : 0,
  }
}
