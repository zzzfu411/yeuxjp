import type { Lesson, LessonItemRef } from "@/data/lesson-types"
import { isKnownVocabularyId } from "@/data/vocabulary/id-registry"
import type { ItemProgressMap, LessonProgress } from "@/lib/learning-progress-types"
import type { SrsMap } from "@/lib/srs-model"

export function getCourseVocabularyIds(lesson: { newItemIds: readonly LessonItemRef[] }) {
  return [...new Set(lesson.newItemIds.filter(item => item.type === "vocab" && isKnownVocabularyId(item.id)).map(item => item.id))]
}

export function courseVocabularyHref(lesson: Pick<Lesson, "id">) {
  return `/learn/${encodeURIComponent(lesson.id)}/vocabulary`
}

export function getCourseVocabularyStatus(ids: readonly string[], lesson: LessonProgress | undefined, items: ItemProgressMap, srs: SrsMap, now: number) {
  const words = [...new Set(ids)].filter(isKnownVocabularyId).map(id => {
    const item = items[id]?.itemType === "vocab" ? items[id] : undefined
    // Vocabulary-card self-rating does not create assessmentEvidence.
    const tested = Object.values(item?.assessmentEvidence ?? {}).some(evidence => (evidence?.attempts ?? 0) > 0)
    return { id, touched: lesson?.status === "completed" || (item?.attempts ?? 0) > 0, tested,
      due: !!srs[id] && Number.isFinite(now) && srs[id].dueAt <= now }
  })
  return { words, touched: words.filter(word => word.touched).length,
    untestedIds: words.filter(word => !word.tested).map(word => word.id), dueIds: words.filter(word => word.due).map(word => word.id) }
}
