import { todayKey, type PracticeResult } from "@/lib/learning-progress-model"

export function countTodayPracticeResults(results: readonly PracticeResult[], today: Date = new Date()) {
  const currentKey = todayKey(today)
  if (!currentKey) return 0

  let count = 0
  for (const result of results) {
    if (typeof result.createdAt !== "number" || !Number.isFinite(result.createdAt)) continue
    if (todayKey(new Date(result.createdAt)) === currentKey) count += 1
  }
  return count
}

export function getDailyPracticeTarget(minutesPerDay: unknown) {
  const minutes = typeof minutesPerDay === "number" && Number.isFinite(minutesPerDay)
    ? Math.min(Math.max(Math.round(minutesPerDay), 5), 30)
    : 10
  return minutes * 2
}

export function millisecondsUntilNextLocalDay(now: Date = new Date()) {
  if (!Number.isFinite(now.getTime())) return 60_000
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return Math.max(1, next.getTime() - now.getTime())
}
