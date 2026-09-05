import {
  averageMastery,
  normalizeItemProgressMap,
  type ItemProgress,
  type ItemProgressMap,
} from "@/lib/learning-progress-model"
import { filterKnownVocabularyIds, isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import { normalizeKanaIdList } from "@/lib/kana-id"
import { isReviewableKanaId } from "@/lib/review-visibility"

export const LEARNING_STATUS_MASTERY_THRESHOLD = 40

export interface LearningStatusModel {
  masteredKanaIds: Set<string>
  learnedVocabIds: Set<string>
}

export function learningStatusMasteryScore(item: ItemProgress | undefined) {
  return averageMastery(item)
}

export function isItemLearnedFromProgress(
  item: ItemProgress | undefined,
  threshold: number = LEARNING_STATUS_MASTERY_THRESHOLD
) {
  if (!item || item.attempts <= 0) return false
  return learningStatusMasteryScore(item) >= threshold
}

export function buildLearningStatusModel({
  masteredKanaIds,
  excludedKanaIds = [],
  learnedVocabIds,
  excludedVocabIds = [],
  items,
  threshold = LEARNING_STATUS_MASTERY_THRESHOLD,
}: {
  masteredKanaIds: Iterable<string>
  excludedKanaIds?: Iterable<string>
  learnedVocabIds: Iterable<string>
  excludedVocabIds?: Iterable<string>
  items: ItemProgressMap
  threshold?: number
}): LearningStatusModel {
  const masteredKana = new Set(normalizeKanaIdList(masteredKanaIds))
  const excludedKana = new Set(normalizeKanaIdList(excludedKanaIds))
  const learnedVocab = new Set(filterKnownVocabularyIds(learnedVocabIds))
  const excludedVocab = new Set(filterKnownVocabularyIds(excludedVocabIds))

  for (const item of Object.values(normalizeItemProgressMap(items))) {
    if (!isItemLearnedFromProgress(item, threshold)) continue
    if (item.itemType === "kana" && isReviewableKanaId(item.itemId)) masteredKana.add(item.itemId)
    if (item.itemType === "vocab" && isKnownVocabularyId(item.itemId)) learnedVocab.add(item.itemId)
  }

  for (const id of excludedKana) masteredKana.delete(id)
  for (const id of excludedVocab) learnedVocab.delete(id)

  return {
    masteredKanaIds: masteredKana,
    learnedVocabIds: learnedVocab,
  }
}
