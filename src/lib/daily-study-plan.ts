import type { LearningEntry } from "@/lib/learning-entry"
import type { UserProfile } from "@/lib/learning-progress-types"
import { normalizeDailyMinutes } from "@/lib/daily-goal"
import { getGoalPracticePlan } from "@/lib/goal-practice"
import { todayKey } from "@/lib/learning-progress-model"
import type { WrittenWorkMap } from "@/lib/written-work-model"
import type { StudyDay } from "@/lib/study-calendar-model"
import { goalWritingTask } from "@/lib/writing-tasks"
import { writingVersion } from "@/lib/written-work-model"

export type DailyStudyTask = { id: string; kind: "review" | "reading" | "writing"; title: string; instruction: string; href: string; minutes: number; optional: boolean; target?: number; workId?: string; workVersion?: string; confirmedAt?: number }
export type DailyStudyPlan = { id: string; date: string; createdAt: number; minutes: number; tasks: DailyStudyTask[] }
export type DailyStudyPlans = Record<string, DailyStudyPlan>

export function buildDailyStudyPlan({ profile, entry, totalDue, now = Date.now(), id = "preview" }: {
  profile: UserProfile | null; entry: LearningEntry; totalDue: number; now?: number; id?: string
}): DailyStudyPlan {
  const minutes = normalizeDailyMinutes(profile?.minutesPerDay)
  const reviewMinutes = totalDue > 0 ? Math.min(6, Math.max(2, Math.floor(minutes / 4))) : 0
  const reviewTarget = Math.min(Math.max(0, Math.floor(totalDue)), Math.max(2, reviewMinutes))
  const writingMinutes = minutes >= 10 ? Math.min(6, Math.floor(minutes / 5)) : 0
  const readingMinutes = minutes - reviewMinutes - writingMinutes
  const activity = getGoalPracticePlan(profile).tasks[0]
  const tasks: DailyStudyTask[] = []
  if (reviewTarget) tasks.push({ id: "review", kind: "review", title: `复习或补练 ${reviewTarget} 题`, target: reviewTarget, minutes: reviewMinutes, optional: false,
    instruction: `本次最多安排 ${reviewTarget} 道短题。按到期队列练习；若长阅读或听写耗时较多，可下次继续。按今日实际保存的复习／补练作答计数，正确率另行记录。`, href: `/review?limit=${reviewTarget}` })
  tasks.push({ id: "reading", kind: "reading", title: `${entry.kind === "consolidation" ? "巩固" : entry.kind === "lesson" ? "课程片段" : "专项片段"} · ${entry.title}`, minutes: readingMinutes, optional: false,
    instruction: entry.kind === "consolidation" ? `在本课小结进入针对性补练，本次先处理一至两道题并阅读反馈。约 ${readingMinutes} 分钟后可暂停，原课程位置会保留。完成后由你确认这次片段。`
      : entry.kind === "lesson" ? `从当前课程位置继续：先读一段讲解或情境，再做一道对应练习。长课文可先读一个段落，约 ${readingMinutes} 分钟后暂停。完成后自行确认本次片段；不要求今天完成整课。`
        : `在${entry.title}中选择一段说明、一组例句或一道待巩固的题，读懂理由并尝试复述。约 ${readingMinutes} 分钟后可暂停，完成后由你确认这次片段。`, href: entry.href })
  if (writingMinutes) tasks.push({ id: "writing", kind: "writing", title: `表达笔记 · ${activity.title}`, minutes: writingMinutes, optional: true,
    instruction: `约 ${writingMinutes} 分钟内先记下一句表达或一个判断依据，完整任务可以分次写。若已写完并完成全部自查，系统记录今日完成；它是可选项。`, href: `/practice/${activity.id}`, workId: `goal:${activity.id}`, workVersion: writingVersion(goalWritingTask(activity)) })
  return { id, date: todayKey(new Date(now)), createdAt: now, minutes, tasks }
}
export function activeDailyPlan(plans: DailyStudyPlans, date: string) {
  return Object.values(plans).filter(plan => plan.date === date).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))[0] ?? null
}
export function dailyTaskDone(task: DailyStudyTask, plan: DailyStudyPlan, day: StudyDay | undefined, works: WrittenWorkMap) {
  if (task.kind === "reading") return task.confirmedAt !== undefined
  if (task.kind === "review") return (day?.reviewCount ?? 0) >= (task.target ?? Number.POSITIVE_INFINITY)
  return Object.values(works).some(work => work.task.id === task.workId && work.version === task.workVersion && work.completedAt !== undefined && todayKey(new Date(work.completedAt)) === plan.date)
}
export function normalizeDailyStudyPlans(input: unknown): DailyStudyPlans | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const out: DailyStudyPlans = {}
  for (const [key, value] of Object.entries(input)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null
    const plan = value as DailyStudyPlan
    if (key !== plan.id || !key || ["__proto__", "constructor", "prototype"].includes(key) || typeof plan.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(plan.date)
      || todayKey(new Date(`${plan.date}T12:00:00`)) !== plan.date || !Number.isFinite(plan.createdAt) || plan.createdAt < 0
      || !Number.isInteger(plan.minutes) || plan.minutes < 5 || plan.minutes > 30 || !Array.isArray(plan.tasks) || !plan.tasks.length) return null
    const seen = new Set()
    for (const task of plan.tasks) {
      if (!task || typeof task !== "object" || !["review", "reading", "writing"].includes(task.kind) || typeof task.id !== "string" || seen.has(task.id)
        || typeof task.title !== "string" || typeof task.instruction !== "string" || typeof task.href !== "string"
        || !/^\/(?:learn\/[^/?#]+|review|practice\/[^/?#]+|kana|grammar|quiz|vocabulary|pragmatics|semantics)(?:[?#].*)?$/.test(task.href)
        || !Number.isInteger(task.minutes) || task.minutes <= 0 || typeof task.optional !== "boolean"
        || (task.kind === "review" && (!Number.isInteger(task.target) || (task.target ?? 0) <= 0))
        || (task.kind === "writing" && (typeof task.workId !== "string" || typeof task.workVersion !== "string"))
        || (task.confirmedAt !== undefined && (!Number.isFinite(task.confirmedAt) || task.confirmedAt < plan.createdAt || task.kind !== "reading"))) return null
      seen.add(task.id)
    }
    if (!plan.tasks.some(task => task.kind === "reading" && !task.optional) || plan.tasks.reduce((sum, task) => sum + task.minutes, 0) > plan.minutes) return null
    out[key] = plan
  }
  return out
}
