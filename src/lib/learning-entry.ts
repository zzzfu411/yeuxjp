import type { Lesson } from "@/data/lessons"

export type LessonEntryStatus = "locked" | "available" | "active" | "done"

export interface LearningEntryLesson {
  id: string
  title: string
  subtitle: string
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

export function isLessonUnlocked(lesson: Pick<Lesson, "prerequisites">, completedLessonIds: ReadonlySet<string>) {
  return lesson.prerequisites.every((id) => completedLessonIds.has(id))
}

export function getLessonEntryStatus(
  lesson: Pick<Lesson, "id" | "prerequisites">,
  completedLessonIds: ReadonlySet<string>,
  activeLessonId: string | null | undefined
): LessonEntryStatus {
  if (completedLessonIds.has(lesson.id)) return "done"
  if (!isLessonUnlocked(lesson, completedLessonIds)) return "locked"
  if (lesson.id === activeLessonId) return "active"
  return "available"
}

export function getLessonEntryBadge(status: LessonEntryStatus) {
  if (status === "done") return "已完成"
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
    subtitle: "入门课程已完成，回到复习页巩固到期项目和错题。",
    href: fallbackHref,
    cta: "进入复习",
  }
}
