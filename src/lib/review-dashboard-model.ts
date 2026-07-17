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

function finiteCount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
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
  const explicitMasteredKanaIds = buildReviewVisibleIdSet({ explicitIds: mastered, itemType: "kana" })
  const explicitLearnedVocabIds = buildReviewVisibleIdSet({ explicitIds: learned, itemType: "vocab" })
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
    mastered: explicitMasteredKanaIds.size,
    learned: explicitLearnedVocabIds.size,
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
  const count = finiteCount(n)
  if (count <= 0) return "0"
  if (count < 1000) return String(count)
  return `${Math.floor(count / 100) / 10}k`
}

export function formatReviewNextDueAt(value: number | null, now: number = Date.now()) {
  if (value === null || !Number.isFinite(value)) return "\u6682\u65e0\u6392\u7a0b"
  if (!Number.isFinite(now)) return "\u6682\u65e0\u6392\u7a0b"

  const diff = value - now
  if (diff <= 0) return "\u73b0\u5728"

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) return `${Math.ceil(diff / minute)} \u5206\u949f\u540e`
  if (diff < day) return `${Math.ceil(diff / hour)} \u5c0f\u65f6\u540e`
  return `${Math.ceil(diff / day)} \u5929\u540e`
}
