import type { KnowledgeReviewCard } from "@/lib/knowledge-review-model"
import type { TodayReviewItem } from "@/lib/review-queue"

/** Capture scheduling evidence when the queue starts. Grading must not change a visible question. */
export function snapshotKnowledgeReviewItems(
  items: TodayReviewItem[],
  cards: ReadonlyMap<string, KnowledgeReviewCard>
): TodayReviewItem[] {
  return items.map((item) => {
    const card = item.deck === "knowledge" ? cards.get(item.id) : undefined
    return card ? { ...item, knowledgeReviewState: { ...card.srs } } : item
  })
}
