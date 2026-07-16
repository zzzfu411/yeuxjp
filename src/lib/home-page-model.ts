import { getNextLesson } from "@/data/lessons"
import { isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import { getKanaById } from "@/lib/kana-id"
import { resolveLearningEntry, type LearningEntry, type LearningEntrySkill } from "@/lib/learning-entry"
import { averageMastery, type ItemProgress, type ItemProgressMap, type PracticeItemType } from "@/lib/learning-progress-model"
import {
  buildReviewVisibleIdSet,
  filterReviewableKanaIds,
  isReviewableKanaId,
} from "@/lib/review-visibility"

export type HomeWeakestItem = {
  id: string
  display: string
  label: string
  score: number
}

export type HomePageModel = {
  dueMistakeIds: string[]
  totalDue: number
  nextLesson: ReturnType<typeof getNextLesson>
  learningEntry: LearningEntry
  completedCount: number
  weakest: HomeWeakestItem | null
}

export function getHomeDueMistakeIds(dueIds: readonly string[], mistakeIds: Iterable<string>) {
  const existing = new Set(mistakeIds)
  return dueIds.filter((id) => existing.has(id))
}

function isHomeWeakestCandidate(item: ItemProgress) {
  if (item.attempts <= 0) return false
  if (item.itemType === "kana") return isReviewableKanaId(item.itemId)
  if (item.itemType === "vocab") return isKnownVocabularyId(item.itemId)
  return true
}

function practiceItemTypeLabel(itemType: PracticeItemType) {
  if (itemType === "kana") return "\u5047\u540d"
  if (itemType === "grammar") return "\u8bed\u6cd5"
  if (itemType === "sentence") return "\u9020\u53e5"
  return "\u8bcd\u6c47"
}

export function getHomeWeakestItem(items: ItemProgressMap): HomeWeakestItem | null {
  const entries = Object.values(items).filter(isHomeWeakestCandidate)
  if (!entries.length) return null

  return entries
    .map((item) => ({
      id: item.itemId,
      display: (() => {
        if (item.itemType !== "kana") return item.itemId
        const parsed = getKanaById(item.itemId)
        return parsed ? `${parsed.kana[parsed.script]} (${parsed.romaji})` : item.itemId
      })(),
      label: practiceItemTypeLabel(item.itemType),
      score: averageMastery(item),
    }))
    .sort((a, b) => a.score - b.score)[0]
}

export function buildHomePageModel({
  completedLessonIds,
  items,
  masteredKanaIds,
  learnedVocabIds,
  skill,
  kanaDueIds,
  vocabDueIds,
  mistakeDueIds,
  mistakeIds,
}: {
  completedLessonIds: ReadonlySet<string>
  items: ItemProgressMap
  masteredKanaIds?: Iterable<string>
  learnedVocabIds?: Iterable<string>
  skill?: LearningEntrySkill | null
  kanaDueIds: readonly string[]
  vocabDueIds: readonly string[]
  mistakeDueIds: readonly string[]
  mistakeIds: Iterable<string>
}): HomePageModel {
  const dueMistakeIds = getHomeDueMistakeIds(mistakeDueIds, mistakeIds)
  const visibleKanaIds = buildReviewVisibleIdSet({ explicitIds: masteredKanaIds ?? [], items, itemType: "kana" })
  const visibleVocabIds = buildReviewVisibleIdSet({ explicitIds: learnedVocabIds ?? [], items, itemType: "vocab" })
  const visibleKanaDueIds = filterReviewableKanaIds(kanaDueIds, visibleKanaIds)
  const visibleVocabDueIds = vocabDueIds.filter((id) => visibleVocabIds.has(id))
  const nextLesson = getNextLesson(new Set(completedLessonIds))

  return {
    dueMistakeIds,
    totalDue: visibleKanaDueIds.length + visibleVocabDueIds.length + dueMistakeIds.length,
    nextLesson,
    learningEntry: resolveLearningEntry({ nextLesson, skill }),
    completedCount: completedLessonIds.size,
    weakest: getHomeWeakestItem(items),
  }
}
