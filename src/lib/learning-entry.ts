import type { Lesson } from "@/data/lesson-types"
import { STARTER_LESSON_BY_ID } from "@/data/lesson-catalog"
import type { LessonTrack } from "@/data/lesson-types"
import type { KanaLevel } from "@/lib/learning-progress-model"
import { isLessonSatisfied, isLessonSkipped } from "@/lib/lesson-skip"
import type { LessonConsolidationTarget } from "@/lib/lesson-consolidation"

export type LessonEntryStatus = "locked" | "available" | "active" | "done" | "skipped"

export interface LearningEntryLesson {
  id: string
  title: string
  subtitle: string
  track?: LessonTrack
}

export interface LearningEntrySkill {
  title: string
  short: string
  href: string
}

export interface LearningEntry {
  kind: "lesson" | "skill" | "review" | "consolidation"
  title: string
  subtitle: string
  href: string
  cta: string
}

export function isLessonUnlocked(
  lesson: Pick<Lesson, "prerequisites"> & Partial<Pick<Lesson, "id">>,
  completedLessonIds: ReadonlySet<string>,
  kanaLevel?: KanaLevel | null,
  entryOrder = 1
) {
  if (lesson.id && completedLessonIds.has(lesson.id)) return true
  return lesson.prerequisites.every((id) => {
    if (completedLessonIds.has(id)) return true
    const prerequisite = STARTER_LESSON_BY_ID[id]
    return prerequisite ? isLessonSatisfied(prerequisite, completedLessonIds, kanaLevel, entryOrder) : false
  })
}

export function getLessonEntryStatus(
  lesson: Pick<Lesson, "id" | "track" | "order" | "prerequisites">,
  completedLessonIds: ReadonlySet<string>,
  activeLessonId: string | null | undefined,
  kanaLevel?: KanaLevel | null,
  entryOrder = 1
): LessonEntryStatus {
  if (completedLessonIds.has(lesson.id)) return "done"
  if (isLessonSkipped(lesson, kanaLevel, entryOrder)) return "skipped"
  if (!isLessonUnlocked(lesson, completedLessonIds, kanaLevel, entryOrder)) return "locked"
  if (lesson.id === activeLessonId) return "active"
  return "available"
}

export function getLessonEntryBadge(status: LessonEntryStatus) {
  if (status === "done") return "已完成"
  if (status === "skipped") return "已跳过"
  if (status === "active") return "下一课"
  if (status === "locked") return "先完成前置"
  return "可学习"
}

export function resolveLearningEntry({
  nextLesson,
  skill,
  consolidation,
  fallbackHref = "/review",
}: {
  nextLesson?: LearningEntryLesson | null
  skill?: LearningEntrySkill | null
  consolidation?: LessonConsolidationTarget | null
  fallbackHref?: string
}): LearningEntry {
  if (consolidation) {
    const { lesson, assessment } = consolidation
    return {
      kind: "consolidation",
      title: lesson.title,
      subtitle: assessment.score === null
        ? `已完成课程，但当前版本尚无有效逐题记录。补测 ${assessment.practiceStepIds.length} 题，确认需要巩固的内容。`
        : `已完成课程，当前独立答对 ${assessment.independentCorrect}/${assessment.total}（${assessment.score}%）。先补练 ${assessment.practiceStepIds.length} 道未独立答对或待补测的题。`,
      href: `/learn/${lesson.id}#lesson-consolidation`,
      cta: "去补练本课",
    }
  }
  if (nextLesson) {
    return {
      kind: "lesson",
      title: nextLesson.title,
      subtitle: nextLesson.subtitle,
      href: `/learn/${nextLesson.id}`,
      cta: "开始课程",
    }
  }

  if (skill) {
    return {
      kind: "skill",
      title: skill.title,
      subtitle: skill.short,
      href: skill.href,
      cta: "开始专项练习",
    }
  }

  return {
    kind: "review",
    title: "复习与巩固",
    subtitle: "当前学习起点之后的课程已完成。接下来可以复习到期内容和错题，或按学习路径加强薄弱项。",
    href: fallbackHref,
    cta: "进入复习",
  }
}
