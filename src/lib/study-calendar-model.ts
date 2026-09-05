import { todayKey, type LessonProgressMap, type PracticeResult } from "@/lib/learning-progress-model"
import { isSelfAssessmentPracticeResult } from "@/lib/daily-goal"

export type StudyDay = { practiceCount: number; independentCorrect: number; selfAssessmentCount: number; lessonCompleted: boolean }
export type StudyCalendar = Record<string, StudyDay>
const emptyDay = (): StudyDay => ({ practiceCount: 0, independentCorrect: 0, selfAssessmentCount: 0, lessonCompleted: false })

export function normalizeStudyCalendar(input: unknown): StudyCalendar | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const out: StudyCalendar = {}
  for (const [key, value] of Object.entries(input)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || todayKey(new Date(`${key}T12:00:00`)) !== key) return null
    if (!value || typeof value !== "object" || Array.isArray(value)) return null
    const day = value as StudyDay
    if (![day.practiceCount, day.independentCorrect, day.selfAssessmentCount].every(n => Number.isSafeInteger(n) && n >= 0)) return null
    if (day.independentCorrect > day.practiceCount || typeof day.lessonCompleted !== "boolean") return null
    out[key] = { practiceCount: day.practiceCount, independentCorrect: day.independentCorrect, selfAssessmentCount: day.selfAssessmentCount, lessonCompleted: day.lessonCompleted }
  }
  return out
}

export function addPracticeToCalendar(calendar: StudyCalendar, result: PracticeResult): StudyCalendar {
  const key = todayKey(new Date(result.createdAt))
  if (!key) return calendar
  const day = calendar[key] ?? emptyDay()
  const selfAssessment = isSelfAssessmentPracticeResult(result)
  return { ...calendar, [key]: { ...day,
    practiceCount: day.practiceCount + (selfAssessment ? 0 : 1),
    independentCorrect: day.independentCorrect + (!selfAssessment && result.correct && !result.assisted ? 1 : 0),
    selfAssessmentCount: day.selfAssessmentCount + (selfAssessment ? 1 : 0),
  } }
}

export function addLessonToCalendar(calendar: StudyCalendar, timestamp: number): StudyCalendar {
  const key = todayKey(new Date(timestamp))
  return key ? { ...calendar, [key]: { ...(calendar[key] ?? emptyDay()), lessonCompleted: true } } : calendar
}

// Older history is bounded. Recover available dates once, without double-counting
// events already included in the durable calendar. Previously evicted dates cannot be inferred.
export function mergeLegacyStudyCalendar(calendar: StudyCalendar, lessons: LessonProgressMap, results: readonly PracticeResult[]): StudyCalendar {
  let legacy: StudyCalendar = {}
  for (const result of results) legacy = addPracticeToCalendar(legacy, result)
  for (const lesson of Object.values(lessons)) {
    if (typeof lesson.completedAt === "number") legacy = addLessonToCalendar(legacy, lesson.completedAt)
    if (typeof lesson.attemptCompletedAt === "number") legacy = addLessonToCalendar(legacy, lesson.attemptCompletedAt)
  }
  const next = { ...calendar }
  for (const [key, value] of Object.entries(legacy)) {
    const stored = next[key] ?? emptyDay()
    next[key] = {
      practiceCount: Math.max(stored.practiceCount, value.practiceCount),
      independentCorrect: Math.max(stored.independentCorrect, value.independentCorrect),
      selfAssessmentCount: Math.max(stored.selfAssessmentCount, value.selfAssessmentCount),
      lessonCompleted: stored.lessonCompleted || value.lessonCompleted,
    }
  }
  return next
}

export function calendarStudyDates(calendar: StudyCalendar) {
  return new Set(Object.keys(calendar).filter(key => {
    const day = calendar[key]
    return day.practiceCount > 0 || day.selfAssessmentCount > 0 || day.lessonCompleted
  }))
}
