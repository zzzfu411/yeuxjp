"use client"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readJsonStorage, validJsonStorageValue, invalidJsonStorageValue } from "@/lib/storage-read-result"
import { writeLearningJson } from "@/lib/learning-storage"
import { runLearningStorageTransaction } from "@/lib/learning-storage-transaction"
import { prepareStudyCalendarWrite } from "@/lib/study-calendar-storage"
import { normalizeDailyStudyPlans, type DailyStudyPlans, type DailyStudyPlan } from "@/lib/daily-study-plan"
import { todayKey } from "@/lib/learning-progress-model"

export function readDailyStudyPlans() {
  return readJsonStorage(STORAGE_KEYS.DAILY_STUDY_PLANS, {} as DailyStudyPlans, input => {
    const value = normalizeDailyStudyPlans(input)
    return value ? validJsonStorageValue(value) : invalidJsonStorageValue<DailyStudyPlans>()
  }, "daily-study-plan")
}
export function saveNewDailyPlan(preview: DailyStudyPlan, id: string, now = Date.now()) {
  const current = readDailyStudyPlans()
  if (!current.ok || preview.date !== todayKey(new Date(now)) || current.value[id]) return false
  const next = { ...current.value, [id]: { ...preview, id, createdAt: now } }
  if (!normalizeDailyStudyPlans(next)) return false
  return writeLearningJson(STORAGE_KEYS.DAILY_STUDY_PLANS, next, { expectedRaw: current.raw })
}
export function confirmDailyReading(planId: string, taskId: string, confirmed: boolean, now = Date.now()) {
  const current = readDailyStudyPlans()
  const plan = current.value[planId]
  if (!current.ok || !plan || plan.date !== todayKey(new Date(now)) || !plan.tasks.some(task => task.id === taskId && task.kind === "reading")) return false
  const tasks = plan.tasks.map(task => task.id === taskId ? { ...task, confirmedAt: confirmed ? now : undefined } : task)
  const writeCalendar = confirmed ? prepareStudyCalendarWrite({ kind: "self-reported", createdAt: now }) : () => true
  if (!writeCalendar) return false
  return runLearningStorageTransaction(() =>
    writeLearningJson(STORAGE_KEYS.DAILY_STUDY_PLANS, { ...current.value, [planId]: { ...plan, tasks } }, { expectedRaw: current.raw }) && writeCalendar()
  )
}
