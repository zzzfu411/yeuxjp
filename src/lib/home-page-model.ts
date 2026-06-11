import { getNextLesson } from "@/data/lessons"
import { resolveLearningEntry, type LearningEntry, type LearningEntrySkill } from "@/lib/learning-entry"
import { averageMastery, type ItemProgressMap, type PracticeItemType } from "@/lib/learning-progress-model"

export type HomeWeakestItem = {
  id: string
  label: string
  score: number
}

export type HomePageModel = {
  dueMistakeIds: string[]
  totalDue: number
  nextLesson: ReturnType<typeof getNextLesson>
  learningEntry: LearningEntry
  completedCount: number
  weakest: HomeWeakestItem | null
}

export function getHomeDueMistakeIds(dueIds: readonly string[], mistakeIds: Iterable<string>) {
  const existing = new Set(mistakeIds)
  return dueIds.filter((id) => existing.has(id))
}

function practiceItemTypeLabel(itemType: PracticeItemType) {
  if (itemType === "kana") return "\u5047\u540d"
  if (itemType === "grammar") return "\u8bed\u6cd5"
  if (itemType === "sentence") return "\u9020\u53e5"
  return "\u8bcd\u6c47"
}

export function getHomeWeakestItem(items: ItemProgressMap): HomeWeakestItem | null {
  const entries = Object.values(items)
  if (!entries.length) return null

  return entries
    .map((item) => ({
      id: item.itemId,
      label: practiceItemTypeLabel(item.itemType),
      score: averageMastery(item),
    }))
    .sort((a, b) => a.score - b.score)[0]
}

export function buildHomePageModel({
  completedLessonIds,
  items,
  skill,
  kanaDueIds,
  vocabDueIds,
  mistakeDueIds,
  mistakeIds,
}: {
  completedLessonIds: ReadonlySet<string>
  items: ItemProgressMap
  skill?: LearningEntrySkill | null
  kanaDueIds: readonly string[]
  vocabDueIds: readonly string[]
  mistakeDueIds: readonly string[]
  mistakeIds: Iterable<string>
}): HomePageModel {
  const dueMistakeIds = getHomeDueMistakeIds(mistakeDueIds, mistakeIds)
  const nextLesson = getNextLesson(new Set(completedLessonIds))

  return {
    dueMistakeIds,
    totalDue: kanaDueIds.length + vocabDueIds.length + dueMistakeIds.length,
    nextLesson,
    learningEntry: resolveLearningEntry({ nextLesson, skill }),
    completedCount: completedLessonIds.size,
    weakest: getHomeWeakestItem(items),
  }
}
