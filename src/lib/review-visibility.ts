import { kanaData } from "@/data/kana-data"
import { isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import type { ItemProgressMap, PracticeItemType } from "@/lib/learning-progress-model"
import type { SrsMap } from "@/lib/srs-model"

type ReviewItemType = Extract<PracticeItemType, "kana" | "vocab">
const REVIEWABLE_KANA_IDS = new Set(kanaData.map((item) => item.romaji))

export function isReviewableKanaId(id: string) {
  return REVIEWABLE_KANA_IDS.has(id)
}

export function buildReviewVisibleIdSet({
  explicitIds,
  items,
  itemType,
}: {
  explicitIds: Iterable<string>
  items?: ItemProgressMap
  itemType: ReviewItemType
}) {
  const visible = new Set<string>()

  for (const id of explicitIds) {
    if (itemType === "kana" && !isReviewableKanaId(id)) continue
    if (itemType === "vocab" && !isKnownVocabularyId(id)) continue
    visible.add(id)
  }

  if (!items) return visible

  for (const item of Object.values(items)) {
    if (item.itemType !== itemType || item.attempts <= 0) continue
    if (itemType === "kana" && !isReviewableKanaId(item.itemId)) continue
    if (itemType === "vocab" && !isKnownVocabularyId(item.itemId)) continue
    visible.add(item.itemId)
  }

  return visible
}

export function filterSrsMapByIds(map: SrsMap, ids: ReadonlySet<string>) {
  const filtered: SrsMap = {}
  for (const [id, state] of Object.entries(map)) {
    if (ids.has(id)) filtered[id] = state
  }
  return filtered
}

export function filterReviewableKanaIds(ids: readonly string[], visibleIds: ReadonlySet<string>) {
  return ids.filter((id) => isReviewableKanaId(id) && visibleIds.has(id))
}

export function filterReviewableKanaSrsMap(map: SrsMap, visibleIds: ReadonlySet<string>) {
  const filtered: SrsMap = {}
  for (const [id, state] of Object.entries(map)) {
    if (isReviewableKanaId(id) && visibleIds.has(id)) filtered[id] = state
  }
  return filtered
}
