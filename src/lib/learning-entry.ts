import { STARTER_LESSON_BY_ID, type Lesson } from "@/data/lessons"
import type { LessonTrack } from "@/data/lesson-types"
import type { KanaLevel } from "@/lib/learning-progress-model"
import { isLessonSatisfied, isLessonSkipped } from "@/lib/lesson-skip"

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
  kind: "lesson" | "skill" | "review"
  title: string
  subtitle: string
  href: string
  cta: string
}

export function isLessonUnlocked(
  lesson: Pick<Lesson, "prerequisites">,
  completedLessonIds: ReadonlySet<string>,
  kanaLevel?: KanaLevel | null
) {
  return lesson.prerequisites.every((id) => {
    if (completedLessonIds.has(id)) return true
    const prerequisite = STARTER_LESSON_BY_ID[id]
    return prerequisite ? isLessonSatisfied(prerequisite, completedLessonIds, kanaLevel) : false
  })
}

export function getLessonEntryStatus(
  lesson: Pick<Lesson, "id" | "track" | "order" | "prerequisites">,
  completedLessonIds: ReadonlySet<string>,
  activeLessonId: string | null | undefined,
  kanaLevel?: KanaLevel | null
): LessonEntryStatus {
  if (completedLessonIds.has(lesson.id)) return "done"
  if (isLessonSkipped(lesson, kanaLevel)) return "skipped"
  if (!isLessonUnlocked(lesson, completedLessonIds, kanaLevel)) return "locked"
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
  fallbackHref = "/review",
}: {
  nextLesson?: LearningEntryLesson | null
  skill?: LearningEntrySkill | null
  fallbackHref?: string
}): LearningEntry {
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
    subtitle: "N5–N2 路径已经走完。回到复习页巩固到期项目和错题，再用技能树补薄弱项。",
    href: fallbackHref,
    cta: "进入复习",
  }
}
