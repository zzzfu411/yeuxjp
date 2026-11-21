import { contentFingerprint } from "@/lib/content-fingerprint"

export type WritingTask = { id: string; title: string; prompt: string; criteria: string[] }
export type WrittenWork = {
  task: WritingTask; version: string; draft: string; checked: number[]; usedModel: boolean
  updatedAt: number; completedAt?: number
}
export type WrittenWorkMap = Record<string, WrittenWork>
export type WorkInput = Pick<WrittenWork, "draft" | "checked" | "usedModel">
export const WORK_DRAFT_LIMIT = 20000
export const writingVersion = (task: WritingTask) => contentFingerprint(task)
export const writingKey = (task: WritingTask) => contentFingerprint([task.id, writingVersion(task)])
export const workToken = (work?: WrittenWork) => contentFingerprint(work ?? null)
export function canCompleteWork(task: WritingTask, input: WorkInput) {
  return !!input.draft.trim() && task.criteria.length > 0 && task.criteria.every((_, index) => input.checked.includes(index))
}
export function makeWrittenWork(task: WritingTask, input: WorkInput, complete: boolean, now: number): WrittenWork | null {
  if (input.draft.length > WORK_DRAFT_LIMIT || !Number.isFinite(now) || now < 0) return null
  if (complete && !canCompleteWork(task, input)) return null
  return { task, version: writingVersion(task), draft: input.draft,
    checked: [...new Set(input.checked)].filter(index => Number.isInteger(index) && index >= 0 && index < task.criteria.length),
    usedModel: input.usedModel, updatedAt: now, ...(complete ? { completedAt: now } : {}) }
}
export function normalizeWrittenWorks(input: unknown): WrittenWorkMap | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const out: WrittenWorkMap = {}
  for (const [key, value] of Object.entries(input)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null
    const work = value as WrittenWork
    const task = work.task
    if (!task || typeof task !== "object" || typeof task.id !== "string" || !task.id || typeof task.title !== "string"
      || typeof task.prompt !== "string" || !Array.isArray(task.criteria) || !task.criteria.every(text => typeof text === "string")
      || writingKey(task) !== key || writingVersion(task) !== work.version || typeof work.draft !== "string" || work.draft.length > WORK_DRAFT_LIMIT
      || !Array.isArray(work.checked) || !work.checked.every(index => Number.isInteger(index) && index >= 0 && index < task.criteria.length)
      || typeof work.usedModel !== "boolean" || !Number.isFinite(work.updatedAt) || work.updatedAt < 0
      || (work.completedAt !== undefined && (!Number.isFinite(work.completedAt) || work.completedAt < 0 || !canCompleteWork(task, work)))) return null
    out[key] = { task, version: work.version, draft: work.draft, checked: [...new Set(work.checked)],
      usedModel: work.usedModel, updatedAt: work.updatedAt, ...(work.completedAt !== undefined ? { completedAt: work.completedAt } : {}) }
  }
  return out
}
