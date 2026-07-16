import { isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import { isKanaId, normalizeKanaIdList, normalizeKanaIdRecord } from "@/lib/kana-id"
import type { ItemProgressMap, PracticeItemType } from "@/lib/learning-progress-model"
import type { SrsMap } from "@/lib/srs-model"

type ReviewItemType = Extract<PracticeItemType, "kana" | "vocab">

export function isReviewableKanaId(id: string) {
  return isKanaId(id)
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
    if (itemType === "kana") {
      for (const kanaId of normalizeKanaIdList([id])) visible.add(kanaId)
      continue
    }
    if (itemType === "vocab" && !isKnownVocabularyId(id)) continue
    visible.add(id)
  }

  if (!items) return visible

  for (const item of Object.values(items)) {
    if (item.itemType !== itemType || item.attempts <= 0) continue
    if (itemType === "kana") {
      for (const kanaId of normalizeKanaIdList([item.itemId])) visible.add(kanaId)
      continue
    }
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
  const filtered: string[] = []
  const seen = new Set<string>()
  for (const id of normalizeKanaIdList(ids)) {
    if (!visibleIds.has(id) || seen.has(id)) continue
    seen.add(id)
    filtered.push(id)
  }
  return filtered
}

export function filterReviewableKanaSrsMap(map: SrsMap, visibleIds: ReadonlySet<string>) {
  const filtered: SrsMap = {}
  for (const [id, state] of Object.entries(normalizeKanaIdRecord(map))) {
    if (state && isReviewableKanaId(id) && visibleIds.has(id)) filtered[id] = state
  }
  return filtered
}
