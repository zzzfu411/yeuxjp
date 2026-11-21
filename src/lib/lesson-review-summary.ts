import type { Lesson } from "@/data/lesson-types"
import { LEARNING_ITEM_INDEX } from "@/data/learning-item-index"
import type { LessonProgress } from "@/lib/learning-progress-types"
import { lessonStepToQuestion } from "@/lib/lesson-session"
import { isCurrentKnowledgeCard, knowledgeReviewId, type KnowledgeReviewMap } from "@/lib/knowledge-review-model"
import { buildMistakeId, type MistakeItem } from "@/lib/mistake-notebook-model"
import { getMistakeRetirement } from "@/lib/mistake-review-compatibility"
import type { SrsMap } from "@/lib/srs-model"

export type LessonReviewSummaryRow = {
  id: string
  title: string
  href: string
  assessment: "unmeasured" | "practice" | "correct" | "reference"
  review: "none" | "scheduled" | "due"
  dueAt?: number
  reviewSource?: "knowledge" | "mistake"
}

/** Keep this course's current answers separate from the existence of an SRS card. */
export function buildLessonReviewSummary(lesson: Lesson, progress: LessonProgress | undefined,
  knowledge: KnowledgeReviewMap, mistakes: readonly MistakeItem[], mistakeSrs: SrsMap, now: number): LessonReviewSummaryRow[] {
  const cards = Object.values(knowledge).filter(isCurrentKnowledgeCard)
  const seen = new Set<string>()
  const rows: LessonReviewSummaryRow[] = []
  for (const step of lesson.steps) {
    if (!("itemId" in step) || !["grammar", "sentence"].includes(step.itemType)) continue
    seen.add(`${step.itemType}:${step.itemId}`)
    const question = lessonStepToQuestion(step)
    const saved = progress?.stepAnswers?.[step.id]
    // Unversioned historical aggregates cannot establish this edition's test result.
    const current = saved?.questionVersion === question.questionVersion ? saved : undefined
    const scheduled: { dueAt: number; source: "knowledge" | "mistake" }[] = cards.filter(card => knowledgeReviewId(card.question) === knowledgeReviewId(question))
      .map(card => ({ dueAt: card.srs.dueAt, source: "knowledge" as const }))
    for (const mistake of mistakes) {
      if (mistake.id !== buildMistakeId(question) || mistake.questionVersion !== question.questionVersion || getMistakeRetirement(mistake)) continue
      if (mistakeSrs[mistake.id]) scheduled.push({ dueAt: mistakeSrs[mistake.id].dueAt, source: "mistake" })
    }
    const next = scheduled.sort((a, b) => a.dueAt - b.dueAt)[0]
    rows.push({
      id: step.id, title: step.title, href: `/learn/${lesson.id}#lesson-consolidation`,
      assessment: !current ? "unmeasured" : current.correct && !current.assisted ? "correct" : "practice",
      review: next ? next.dueAt <= now ? "due" : "scheduled" : "none",
      ...(next ? { dueAt: next.dueAt, reviewSource: next.source } : {}),
    })
  }
  for (const item of lesson.newItemIds) {
    const key = `${item.type}:${item.id}`
    if (!["grammar", "sentence"].includes(item.type) || seen.has(key)) continue
    seen.add(key)
    const reference = LEARNING_ITEM_INDEX[key]
    rows.push({ id: key, title: reference?.[0] ?? item.id, href: reference?.[1] ?? `/learn/${lesson.id}`,
      assessment: "reference", review: "none" })
  }
  return rows
}
