export type {
  LessonTrack,
  LessonItemType,
  LessonPracticeMode,
  LessonItemRef,
  ExplainStep,
  ExampleStep,
  ChoiceStep,
  TypingStep,
  DictationStep,
  SentenceBuildStep,
  SummaryStep,
  LessonStep,
  Lesson,
} from "./lesson-types"

import type { KanaLevel } from "@/lib/learning-progress-model"
import { getNextCourseLesson } from "@/lib/lesson-skip"
import type { ChoiceStep, DictationStep, Lesson, LessonStep, SentenceBuildStep, SummaryStep, TypingStep } from "./lesson-types"
import { DAYS_01_21 } from "./lessons/days-01-21"
import { DAYS_22_45 } from "./lessons/days-22-45"
import { DAYS_46_90 } from "./lessons/days-46-90"
import { DAYS_91_135 } from "./lessons/days-91-135"
import { DAYS_136_175 } from "./lessons/days-136-175"

export const STARTER_LESSONS: Lesson[] = [
  ...DAYS_01_21, ...DAYS_22_45, ...DAYS_46_90, ...DAYS_91_135, ...DAYS_136_175,
]

export const STARTER_LESSON_BY_ID = Object.fromEntries(STARTER_LESSONS.map((lesson) => [lesson.id, lesson])) as Record<string, Lesson>

export function getLessonById(id: string) {
  return STARTER_LESSON_BY_ID[id] ?? null
}

export function getNextLesson(completedLessonIds: ReadonlySet<string>, kanaLevel?: KanaLevel | null) {
  return getNextCourseLesson(STARTER_LESSONS, completedLessonIds, kanaLevel)
}

export function getLessonSummary(lessonId: string) {
  const lesson = getLessonById(lessonId)
  if (!lesson) return null
  const summary = lesson.steps.find((step): step is SummaryStep => step.type === "summary")
  return summary ?? null
}

export function isPracticeStep(step: LessonStep): step is ChoiceStep | TypingStep | DictationStep | SentenceBuildStep {
  return step.type === "multipleChoice" || step.type === "typing" || step.type === "dictation" || step.type === "sentenceBuild"
}
