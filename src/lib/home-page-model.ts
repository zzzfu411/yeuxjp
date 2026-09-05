import { STARTER_LESSONS, getNextLesson } from "@/data/lesson-catalog"
import { LEARNING_ITEM_INDEX } from "@/data/learning-item-index"
import { isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import { summarizeLearnedVocabIds } from "@/data/vocabulary/stats"
import { getKanaById } from "@/lib/kana-id"
import { resolveLearningEntry, type LearningEntry, type LearningEntrySkill } from "@/lib/learning-entry"
import { averageMastery, type ItemProgress, type ItemProgressMap, type KanaLevel, type PracticeItemType } from "@/lib/learning-progress-model"
import { countSatisfiedLessons } from "@/lib/lesson-skip"
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
  itemType: PracticeItemType
}

export type HomePageModel = {
  dueMistakeIds: string[]
  totalDue: number
  nextLesson: ReturnType<typeof getNextLesson>
  learningEntry: LearningEntry
  completedCount: number
  skippedCount: number
  survivalDone: number
  survivalTotal: number
  weakest: HomeWeakestItem | null
  weakestHref: string
}

export function getWeakestPracticeHref(itemType: PracticeItemType | undefined, id?: string) {
  if (id && itemType === "kana") {
    const parsed = getKanaById(id)
    if (parsed) return `/kana?mode=${parsed.script}&set=${parsed.kana.type === "handakuon" ? "dakuon" : parsed.kana.type}&item=${encodeURIComponent(id)}`
  }
  if (id && LEARNING_ITEM_INDEX[`${itemType}:${id}`]) return LEARNING_ITEM_INDEX[`${itemType}:${id}`][1]
  if (itemType === "kana") return "/kana"
  if (itemType === "vocab") return "/vocabulary"
  if (itemType === "grammar") return "/grammar"
  if (itemType === "sentence") return "/quiz?mode=particle"
  return "/quiz"
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
        if (item.itemType !== "kana") return LEARNING_ITEM_INDEX[`${item.itemType}:${item.itemId}`]?.[0] ?? `${practiceItemTypeLabel(item.itemType)}练习`
        const parsed = getKanaById(item.itemId)
        return parsed ? `${parsed.kana[parsed.script]} (${parsed.romaji})` : item.itemId
      })(),
      label: practiceItemTypeLabel(item.itemType),
      score: averageMastery(item),
      itemType: item.itemType,
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
  kanaLevel,
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
  kanaLevel?: KanaLevel | null
}): HomePageModel {
  const dueMistakeIds = getHomeDueMistakeIds(mistakeDueIds, mistakeIds)
  const visibleKanaIds = buildReviewVisibleIdSet({ explicitIds: masteredKanaIds ?? [], items, itemType: "kana" })
  const visibleVocabIds = buildReviewVisibleIdSet({ explicitIds: learnedVocabIds ?? [], items, itemType: "vocab" })
  const visibleKanaDueIds = filterReviewableKanaIds(kanaDueIds, visibleKanaIds)
  const visibleVocabDueIds = vocabDueIds.filter((id) => visibleVocabIds.has(id))
  const nextLesson = getNextLesson(completedLessonIds, kanaLevel)
  const vocabStats = summarizeLearnedVocabIds(learnedVocabIds ?? [])
  const weakest = getHomeWeakestItem(items)

  return {
    dueMistakeIds,
    totalDue: visibleKanaDueIds.length + visibleVocabDueIds.length + dueMistakeIds.length,
    nextLesson,
    learningEntry: resolveLearningEntry({ nextLesson, skill }),
    completedCount: STARTER_LESSONS.filter(lesson => completedLessonIds.has(lesson.id)).length,
    skippedCount: countSatisfiedLessons(STARTER_LESSONS, completedLessonIds, kanaLevel) - STARTER_LESSONS.filter(lesson => completedLessonIds.has(lesson.id)).length,
    survivalDone: vocabStats.survival.done,
    survivalTotal: vocabStats.survival.total,
    weakest,
    weakestHref: getWeakestPracticeHref(weakest?.itemType, weakest?.id),
  }
}
