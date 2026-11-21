import { normalizeKanaIdList, normalizeKanaIdRecord } from "@/lib/kana-id"
import type { SrsMap, SrsState } from "@/lib/srs-model"

export type ReviewDeck = "kana" | "vocab" | "mistakes" | "knowledge"
export type TodayReviewItem = { deck: ReviewDeck; id: string; knowledgeReviewState?: SrsState }

type DueReviewItem = TodayReviewItem & {
  deck: "kana" | "vocab" | "knowledge"
  dueAt: number
  deckSize: number
  order: number
}

const DUE_REVIEW_DECK_ORDER = {
  kana: 0,
  vocab: 1,
  knowledge: 2,
} as const


function getReviewDueAt(map: SrsMap, id: string) {
  return map[id]?.dueAt ?? Number.MAX_SAFE_INTEGER
}

function buildDueReviewItems({
  deck,
  ids,
  srsMap,
}: {
  deck: "kana" | "vocab" | "knowledge"
  ids: string[]
  srsMap: SrsMap
}): DueReviewItem[] {
  const deckSize = ids.length
  return ids.map((id, order) => ({
    deck,
    id,
    dueAt: getReviewDueAt(srsMap, id),
    deckSize,
    order,
  }))
}

function sortDueReviewItems(items: DueReviewItem[]): TodayReviewItem[] {
  return [...items]
    .sort((a, b) => {
      const dueOrder = a.dueAt - b.dueAt
      if (dueOrder !== 0) return dueOrder

      const deckSizeOrder = a.deckSize - b.deckSize
      if (deckSizeOrder !== 0) return deckSizeOrder

      const deckOrder = DUE_REVIEW_DECK_ORDER[a.deck] - DUE_REVIEW_DECK_ORDER[b.deck]
      if (deckOrder !== 0) return deckOrder

      return a.order - b.order
    })
    .map(({ deck, id }) => ({ deck, id }))
}

export const TODAY_REVIEW_QUEUE_LIMIT = 30

function normalizeTodayReviewQueueLimit(limit: number) {
  if (!Number.isFinite(limit)) return TODAY_REVIEW_QUEUE_LIMIT
  const normalized = Math.floor(limit)
  return normalized >= 1 ? normalized : TODAY_REVIEW_QUEUE_LIMIT
}

export function buildTodayReviewQueue({
  dueMistakeIds,
  kanaDueIds,
  kanaSrsMap,
  vocabDueIds,
  vocabSrsMap,
  knowledgeDueIds = [],
  knowledgeSrsMap = {},
  limit = TODAY_REVIEW_QUEUE_LIMIT,
}: {
  dueMistakeIds: string[]
  kanaDueIds: string[]
  kanaSrsMap: SrsMap
  vocabDueIds: string[]
  vocabSrsMap: SrsMap
  knowledgeDueIds?: string[]
  knowledgeSrsMap?: SrsMap
  limit?: number
}): TodayReviewItem[] {
  const kanaIds = normalizeKanaIdList(kanaDueIds)
  const normalizedKanaSrsMap = normalizeKanaIdRecord(kanaSrsMap) as SrsMap
  const dueItems = [
    ...buildDueReviewItems({ deck: "kana", ids: kanaIds, srsMap: normalizedKanaSrsMap }),
    ...buildDueReviewItems({ deck: "vocab", ids: vocabDueIds, srsMap: vocabSrsMap }),
    ...buildDueReviewItems({ deck: "knowledge", ids: knowledgeDueIds, srsMap: knowledgeSrsMap }),
  ]

  return [
    ...dueMistakeIds.map((id) => ({ deck: "mistakes" as const, id })),
    ...sortDueReviewItems(dueItems),
  ].slice(0, normalizeTodayReviewQueueLimit(limit))
}
