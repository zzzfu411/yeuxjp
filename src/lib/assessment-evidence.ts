import { AUDIT_AFFECTED_MODES, AUDIT_RECHECK_MODES } from "@/data/audit-affected-modes"
import type { ItemProgress, AssessmentEvidence, OutputEvidence, PracticeMode, PracticeResult } from "@/lib/learning-progress-types"

export const CURRENT_ASSESSMENT_REVISION = "audit-2026-09-09-v1"
const modes: PracticeMode[] = ["recognition", "listening", "meaning", "recall", "production"]
const count = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
const score = (value: unknown) => Math.min(100, count(value))

export function normalizeAssessmentEvidence(input: unknown): ItemProgress["assessmentEvidence"] {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined
  const result: Partial<Record<PracticeMode, AssessmentEvidence>> = {}
  for (const mode of modes) {
    const value = (input as Record<string, unknown>)[mode]
    if (!value || typeof value !== "object") continue
    const evidence = value as Partial<AssessmentEvidence>
    result[mode] = { score: score(evidence.score), attempts: count(evidence.attempts), correct: Math.min(count(evidence.correct), count(evidence.attempts)) }
    if (evidence.versioned && typeof evidence.versioned === "object" && !Array.isArray(evidence.versioned)) {
      const versioned: Record<string, OutputEvidence> = {}
      for (const [revision, raw] of Object.entries(evidence.versioned)) {
        if (!revision || ["__proto__", "prototype", "constructor"].includes(revision) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue
        versioned[revision] = { score: score(raw.score), attempts: count(raw.attempts), correct: Math.min(count(raw.correct), count(raw.attempts)) }
      }
      result[mode]!.versioned = versioned
    }
  }
  return result
}

export function updateAssessmentEvidence(item: ItemProgress, result: PracticeResult) {
  if (result.assisted || result.assessmentRevision !== CURRENT_ASSESSMENT_REVISION) return item.assessmentEvidence
  const previous = item.assessmentEvidence?.[result.mode]
  const increment = (evidence?: OutputEvidence): OutputEvidence => ({
    score: score((evidence?.score ?? 0) + (result.correct ? 18 : -10)),
    attempts: (evidence?.attempts ?? 0) + 1,
    correct: (evidence?.correct ?? 0) + (result.correct ? 1 : 0),
  })
  const next: AssessmentEvidence = { ...previous, ...increment(previous) }
  const recheck = AUDIT_RECHECK_MODES[`${item.itemType}:${item.itemId}`]?.[result.mode]
  if (recheck && result.questionVersion && recheck.versions.includes(result.questionVersion)) {
    // Preserve earlier aggregates and revision buckets as history. Only a current
    // source can establish evidence after a content correction.
    next.versioned = { ...previous?.versioned, [recheck.revision]: increment(previous?.versioned?.[recheck.revision]) }
  }
  return { ...item.assessmentEvidence, [result.mode]: next }
}

export function getCurrentAssessmentEvidence(item: ItemProgress, mode: PracticeMode) {
  const evidence = item.assessmentEvidence?.[mode]
  const recheck = AUDIT_RECHECK_MODES[`${item.itemType}:${item.itemId}`]?.[mode]
  return recheck ? evidence?.versioned?.[recheck.revision] : evidence
}

export function getRecordedAssessmentModes(item: ItemProgress) {
  return Array.isArray(item.assessedModes)
    ? modes.filter(mode => item.assessedModes!.includes(mode))
    : modes.filter(mode => Number.isFinite(item[mode]) && item[mode] > 0)
}

export function getUnverifiedAssessmentModes(item: ItemProgress) {
  const affected = AUDIT_AFFECTED_MODES[`${item.itemType}:${item.itemId}`] ?? []
  return getRecordedAssessmentModes(item).filter(mode => affected.includes(mode) && !(getCurrentAssessmentEvidence(item, mode)?.attempts))
}

export function getAssessedModes(item: ItemProgress): PracticeMode[] {
  const unverified = getUnverifiedAssessmentModes(item)
  return getRecordedAssessmentModes(item).filter(mode => !unverified.includes(mode) && (mode !== "production" || (item.outputEvidence?.attempts ?? 0) > 0))
}

export function getModeMastery(item: ItemProgress, mode: PracticeMode) {
  if (mode === "production") return score(item.outputEvidence?.score)
  return AUDIT_AFFECTED_MODES[`${item.itemType}:${item.itemId}`]?.includes(mode)
    ? score(getCurrentAssessmentEvidence(item, mode)?.score) : score(item[mode])
}

export function averageMastery(item?: ItemProgress) {
  if (!item) return 0
  const assessed = getAssessedModes(item)
  return assessed.length ? Math.round(assessed.reduce((sum, mode) => sum + getModeMastery(item, mode), 0) / assessed.length) : 0
}
