import type { Lesson, LessonStep } from "@/data/lesson-types"
import type { LessonStepAnswer } from "@/lib/lesson-step-answers"
import type { LessonProgress } from "@/lib/learning-progress-types"
import { LEGACY_QUESTION_VERSIONS } from "@/data/legacy-question-versions"
import { getLessonStepVersion, getLessonStepVersions } from "@/lib/lesson-content-fingerprint"

export function isCurrentLessonAnswer(step: LessonStep, answer?: Pick<LessonStepAnswer, "questionVersion">) {
  if (!answer) return false
  const version = getLessonStepVersion(step)
  return answer.questionVersion ? answer.questionVersion === version : LEGACY_QUESTION_VERSIONS.has(version)
}

export function getLessonUpdates(lesson: Lesson, progress?: LessonProgress) {
  if (!progress || progress.status !== "completed") return []
  const versions = getLessonStepVersions(lesson)
  return lesson.steps.filter(step => {
    if (step.type === "summary") return false
    if (progress.completedStepVersions?.[step.id] === versions[step.id]) return false
    if ("itemId" in step) return !isCurrentLessonAnswer(step, progress.stepAnswers?.[step.id])
    // Old completions did not record which explanation/reading edition was read.
    return true
  })
}

export function nextLessonStepIndex(lesson: Lesson, index: number, direction: 1 | -1, updateStepIds?: readonly string[]) {
  if (!updateStepIds) return Math.max(0, Math.min(index + direction, lesson.steps.length - 1))
  const included = new Set(updateStepIds)
  const indices = lesson.steps.flatMap((step, i) => included.has(step.id) || step.type === "summary" ? [i] : [])
  return direction === 1 ? indices.find(i => i > index) ?? lesson.steps.length - 1
    : [...indices].reverse().find(i => i < index) ?? indices[0] ?? 0
}
