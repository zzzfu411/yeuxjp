import { buildTodayReviewQueue, type TodayReviewItem } from "@/lib/review-questions"
import { getNextSrsDueAt, type SrsMap } from "@/lib/srs-model"
import type { ItemProgressMap } from "@/lib/learning-progress-model"
import {
  buildReviewVisibleIdSet,
  filterReviewableKanaIds,
  filterReviewableKanaSrsMap,
  filterSrsMapByIds,
} from "@/lib/review-visibility"

type IdCollection = Iterable<string>

export type ReviewDashboardCounts = {
  mistakesDue: number
  kanaDue: number
  vocabDue: number
}

export type ReviewDashboardTotals = {
  kana: number
  vocab: number
  mistakes: number
  mastered: number
  learned: number
}

export type ReviewDashboardModelInput = {
  masteredIds: IdCollection
  learnedIds: IdCollection
  items?: ItemProgressMap
  mistakeIds: IdCollection
  kanaSrsMap: SrsMap
  kanaDueIds: readonly string[]
  vocabSrsMap: SrsMap
  vocabDueIds: readonly string[]
  mistakeSrsMap: SrsMap
  mistakeDueIds: readonly string[]
  now?: number
}

export type ReviewDashboardModel = {
  dueMistakeIds: string[]
  reviewableKanaDueIds: string[]
  vocabDueIds: string[]
  kanaEnrollMissing: string[]
  vocabEnrollMissing: string[]
  mistakeEnrollMissing: string[]
  todayQueue: TodayReviewItem[]
  totalEnrolled: number
  totalDue: number
  isFirstTime: boolean
  nextDueAt: number | null
  counts: ReviewDashboardCounts
  totals: ReviewDashboardTotals
}

function idsToSet(ids: IdCollection) {
  return new Set(ids)
}

function findMissingSrsEnrollments(ids: Set<string>, map: SrsMap) {
  const missing: string[] = []
  for (const id of ids) {
    if (!map[id]) missing.push(id)
  }
  return missing
}

export function enrollMissingReviewItems(ids: readonly string[], enroll: (id: string) => boolean) {
  let ok = true
  for (const id of ids) {
    ok = enroll(id) && ok
  }
  return ok
}

export function buildReviewDashboardModel({
  masteredIds,
  learnedIds,
  items,
  mistakeIds,
  kanaSrsMap,
  kanaDueIds,
  vocabSrsMap,
  vocabDueIds,
  mistakeSrsMap,
  mistakeDueIds,
  now,
}: ReviewDashboardModelInput): ReviewDashboardModel {
  const mastered = idsToSet(masteredIds)
  const learned = idsToSet(learnedIds)
  const visibleKanaIds = buildReviewVisibleIdSet({ explicitIds: mastered, items, itemType: "kana" })
  const visibleVocabIds = buildReviewVisibleIdSet({ explicitIds: learned, items, itemType: "vocab" })
  const mistakeIdSet = idsToSet(mistakeIds)

  const dueMistakeIds = mistakeDueIds.filter((id) => mistakeIdSet.has(id))
  const reviewableKanaDueIds = filterReviewableKanaIds(kanaDueIds, visibleKanaIds)
  const visibleVocabDueIds = vocabDueIds.filter((id) => visibleVocabIds.has(id))
  const visibleKanaSrsMap = filterReviewableKanaSrsMap(kanaSrsMap, visibleKanaIds)
  const visibleVocabSrsMap = filterSrsMapByIds(vocabSrsMap, visibleVocabIds)
  const visibleMistakeSrsMap = filterSrsMapByIds(mistakeSrsMap, mistakeIdSet)
  const kanaEnrollMissing = findMissingSrsEnrollments(visibleKanaIds, kanaSrsMap)
  const vocabEnrollMissing = findMissingSrsEnrollments(visibleVocabIds, vocabSrsMap)
  const mistakeEnrollMissing = findMissingSrsEnrollments(mistakeIdSet, mistakeSrsMap)
  const todayQueue = buildTodayReviewQueue({
    dueMistakeIds,
    kanaDueIds: reviewableKanaDueIds,
    kanaSrsMap: visibleKanaSrsMap,
    vocabDueIds: visibleVocabDueIds,
    vocabSrsMap: visibleVocabSrsMap,
  })
  const totals: ReviewDashboardTotals = {
    kana: Object.keys(visibleKanaSrsMap).length,
    vocab: Object.keys(visibleVocabSrsMap).length,
    mistakes: mistakeIdSet.size,
    mastered: visibleKanaIds.size,
    learned: visibleVocabIds.size,
  }
  const counts: ReviewDashboardCounts = {
    mistakesDue: dueMistakeIds.length,
    kanaDue: reviewableKanaDueIds.length,
    vocabDue: visibleVocabDueIds.length,
  }

  return {
    dueMistakeIds,
    reviewableKanaDueIds,
    vocabDueIds: visibleVocabDueIds,
    kanaEnrollMissing,
    vocabEnrollMissing,
    mistakeEnrollMissing,
    todayQueue,
    totalEnrolled: totals.kana + totals.vocab + totals.mistakes,
    totalDue: counts.kanaDue + counts.vocabDue + counts.mistakesDue,
    isFirstTime: totals.kana + totals.vocab + totals.mistakes === 0 && visibleKanaIds.size === 0 && visibleVocabIds.size === 0,
    nextDueAt: getNextSrsDueAt([visibleKanaSrsMap, visibleVocabSrsMap, visibleMistakeSrsMap], now),
    counts,
    totals,
  }
}

export function formatReviewDueCount(n: number) {
  if (n <= 0) return "0"
  if (n < 1000) return String(n)
  return `${Math.floor(n / 100) / 10}k`
}

export function formatReviewNextDueAt(value: number | null, now: number = Date.now()) {
  if (!value) return "暂无排程"

  const diff = value - now
  if (diff <= 0) return "现在"

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) return `${Math.ceil(diff / minute)} 分钟后`
  if (diff < day) return `${Math.ceil(diff / hour)} 小时后`
  return `${Math.ceil(diff / day)} 天后`
}
