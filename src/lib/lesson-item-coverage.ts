import type { Lesson, LessonItemType } from "@/data/lesson-types"

export function countLessonItemIds(lessons: readonly Pick<Lesson, "newItemIds">[], type: LessonItemType) {
  const ids = new Set<string>()
  for (const lesson of lessons) {
    for (const item of lesson.newItemIds) {
      if (item.type === type) ids.add(item.id)
    }
  }
  return ids.size
}

export function getLessonVocabIds(lesson: Pick<Lesson, "newItemIds">) {
  return lesson.newItemIds.filter((item) => item.type === "vocab").map((item) => item.id)
}

export type VocabLessonAppearance = {
  id: string
  order: number
}

export function getVocabLessonAppearances(
  lessons: readonly Pick<Lesson, "id" | "order" | "newItemIds">[],
  vocabId: string
): VocabLessonAppearance[] {
  return lessons
    .filter((lesson) => lesson.newItemIds.some((item) => item.type === "vocab" && item.id === vocabId))
    .map((lesson) => ({ id: lesson.id, order: lesson.order }))
}
