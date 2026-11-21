import type { ReferenceLevel } from "@/lib/learning-progress-types"

export type GoalPracticeSource = "home" | "path"

export function parseMediaLevel(value?: string | null): ReferenceLevel | undefined {
  return value === "N5" || value === "N4" || value === "N3" || value === "N2" ? value : undefined
}

export function goalPracticeTaskHref(taskId: string, source: GoalPracticeSource, mediaLevel?: ReferenceLevel) {
  const query = new URLSearchParams({ source })
  if (mediaLevel) query.set("mediaLevel", mediaLevel)
  return `/practice/${encodeURIComponent(taskId)}?${query}`
}

export function goalPracticeReturn(source?: string | null, level?: string | null) {
  if (source !== "home" && source !== "path") return { href: "/#daily-study-plan", label: "返回今日安排" }
  const mediaLevel = parseMediaLevel(level)
  const query = mediaLevel ? `?mediaLevel=${mediaLevel}` : ""
  return { href: `${source === "path" ? "/path" : "/"}${query}#goal-practice`, label: source === "path" ? "返回路径专项" : "返回首页专项" }
}
