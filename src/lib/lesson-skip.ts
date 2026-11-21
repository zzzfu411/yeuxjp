import type { Lesson } from "@/data/lesson-types"
import type { KanaLevel } from "@/lib/learning-progress-model"

export const KANA_FOUNDATION_LAST_ORDER = 21

export function isKanaFoundationLesson(lesson: Pick<Lesson, "track" | "order">) {
  return lesson.track === "starter-45" && lesson.order <= KANA_FOUNDATION_LAST_ORDER
}

export function isLessonSkipped(
  lesson: Pick<Lesson, "track" | "order">,
  kanaLevel?: KanaLevel | null,
  entryOrder = 1
) {
  return ([46, 91, 136].includes(entryOrder) && lesson.order < entryOrder) || (kanaLevel === "solid" && isKanaFoundationLesson(lesson))
}

export function isLessonSatisfied(
  lesson: Pick<Lesson, "id" | "track" | "order">,
  completedLessonIds: ReadonlySet<string>,
  kanaLevel?: KanaLevel | null,
  entryOrder = 1
) {
  return completedLessonIds.has(lesson.id) || isLessonSkipped(lesson, kanaLevel, entryOrder)
}

export function getNextCourseLesson<T extends Pick<Lesson, "id" | "track" | "order" | "prerequisites">>(
  lessons: readonly T[],
  completedLessonIds: ReadonlySet<string>,
  kanaLevel?: KanaLevel | null,
  entryOrder = 1
) {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]))
  return (
    lessons.find((lesson) => {
      if (isLessonSatisfied(lesson, completedLessonIds, kanaLevel, entryOrder)) return false
      return lesson.prerequisites.every((id) => {
        const prerequisite = byId.get(id)
        return prerequisite ? isLessonSatisfied(prerequisite, completedLessonIds, kanaLevel, entryOrder) : completedLessonIds.has(id)
      })
    }) ?? null
  )
}

export function countSatisfiedLessons(
  lessons: readonly Pick<Lesson, "id" | "track" | "order">[],
  completedLessonIds: ReadonlySet<string>,
  kanaLevel?: KanaLevel | null,
  entryOrder = 1
) {
  return lessons.filter((lesson) => isLessonSatisfied(lesson, completedLessonIds, kanaLevel, entryOrder)).length
}
