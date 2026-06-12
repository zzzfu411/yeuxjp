import {
  averageMastery,
  type ItemProgress,
  type ItemProgressMap,
} from "@/lib/learning-progress-model"
import { filterKnownVocabularyIds, isKnownVocabularyId } from "@/data/vocabulary/id-registry"

export const LEARNING_STATUS_MASTERY_THRESHOLD = 40

export interface LearningStatusModel {
  masteredKanaIds: Set<string>
  learnedVocabIds: Set<string>
}

export function isItemLearnedFromProgress(
  item: ItemProgress | undefined,
  threshold: number = LEARNING_STATUS_MASTERY_THRESHOLD
) {
  if (!item || item.attempts <= 0) return false
  return averageMastery(item) >= threshold
}

export function buildLearningStatusModel({
  masteredKanaIds,
  learnedVocabIds,
  items,
  threshold = LEARNING_STATUS_MASTERY_THRESHOLD,
}: {
  masteredKanaIds: Iterable<string>
  learnedVocabIds: Iterable<string>
  items: ItemProgressMap
  threshold?: number
}): LearningStatusModel {
  const masteredKana = new Set(masteredKanaIds)
  const learnedVocab = new Set(filterKnownVocabularyIds(learnedVocabIds))

  for (const item of Object.values(items)) {
    if (!isItemLearnedFromProgress(item, threshold)) continue
    if (item.itemType === "kana") masteredKana.add(item.itemId)
    if (item.itemType === "vocab" && isKnownVocabularyId(item.itemId)) learnedVocab.add(item.itemId)
  }

  return {
    masteredKanaIds: masteredKana,
    learnedVocabIds: learnedVocab,
  }
}
