import { STARTER_LESSONS, type LessonSummary } from "@/data/lesson-catalog"
import { LESSON_ASSESSMENT_STEPS } from "@/data/lesson-assessment-index"
import type { LessonProgress, LessonProgressMap } from "@/lib/learning-progress-types"

export const COURSE_ASSESSMENT_THRESHOLD = 80

export function getLessonConsolidation(lessonId: string, progress?: LessonProgress) {
  const steps = LESSON_ASSESSMENT_STEPS[lessonId] ?? []
  let measured = 0
  let independentCorrect = 0
  const practiceStepIds: string[] = []
  for (const [id, version] of steps) {
    const answer = progress?.stepAnswers?.[id]
    // Unversioned first-completion scores remain historical, not evidence of the revised assessment.
    const current = answer?.questionVersion === version
    if (current) measured++
    if (current && answer.correct && !answer.assisted) independentCorrect++
    else practiceStepIds.push(id)
  }
  const total = steps.length
  const score = measured > 0 && total > 0 ? Math.round(independentCorrect / total * 100) : null
  const status = !measured ? "unmeasured" : measured === total && independentCorrect / total * 100 >= COURSE_ASSESSMENT_THRESHOLD ? "passed" : "practice"
  return { status, score, total, measured, independentCorrect, practiceStepIds } as const
}

export type LessonConsolidationTarget = {
  lesson: LessonSummary
  assessment: ReturnType<typeof getLessonConsolidation>
}

export function getRecommendedConsolidation(lessons: LessonProgressMap, entryOrder = 1): LessonConsolidationTarget | null {
  // Course order makes prerequisite gaps predictable. Continuing later courses remains available.
  for (const lesson of STARTER_LESSONS) {
    if ([46, 91, 136].includes(entryOrder) && lesson.order < entryOrder) continue
    if (lessons[lesson.id]?.status !== "completed") continue
    const assessment = getLessonConsolidation(lesson.id, lessons[lesson.id])
    if (assessment.total && assessment.status !== "passed") return { lesson, assessment }
  }
  return null
}

export function consolidationLabel(assessment: ReturnType<typeof getLessonConsolidation>) {
  if (assessment.status === "unmeasured") return "需补测"
  return assessment.status === "passed" ? "本课测评达标" : "需巩固"
}
