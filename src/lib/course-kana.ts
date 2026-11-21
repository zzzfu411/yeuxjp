import type { Lesson, LessonItemRef } from "@/data/lesson-types"
import { kanaData } from "@/data/kana-data"
import { getKanaById } from "@/lib/kana-id"
import type { ItemProgressMap } from "@/lib/learning-progress-types"
import { generateKanaQuizQuestion } from "@/lib/quiz-question-builders"
import { getQuestionContentVersion } from "@/lib/question-content-version"

export type CourseKanaDirection = "recognition" | "listening"
export function courseKanaHref(lesson: Pick<Lesson, "id">) { return `/learn/${encodeURIComponent(lesson.id)}/kana` }
export function getCourseKanaIds(lesson: { newItemIds: readonly LessonItemRef[] }) {
  return [...new Set(lesson.newItemIds.filter(item => item.type === "kana" && getKanaById(item.id)).map(item => item.id))]
}
export function getUntestedCourseKanaIds(ids: readonly string[], items: ItemProgressMap, direction: CourseKanaDirection) {
  return ids.filter(id => items[id]?.itemType !== "kana" || !(items[id]?.assessmentEvidence?.[direction]?.attempts))
}
export function makeCourseKanaQuestion(id: string, direction: CourseKanaDirection, random: () => number = Math.random) {
  const parsed = getKanaById(id)
  if (!parsed) return null
  const question = generateKanaQuizQuestion({ mode: direction === "listening" ? "audio-kana" : "hiragana-romaji",
    basePool: kanaData, targetPool: [parsed.kana], script: parsed.script, random })
  return question ? { ...question, questionVersion: getQuestionContentVersion(question) } : null
}
