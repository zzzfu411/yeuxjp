export function formatReviewDueCount(n: number) {
  if (n <= 0) return "0"
  if (n < 1000) return String(n)
  return `${Math.floor(n / 100) / 10}k`
}

export function formatReviewNextDueAt(value: number | null, now: number = Date.now()) {
  if (!value) return "暂无排程"

  const diff = value - now
  if (diff <= 0) return "现在"

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) return `${Math.ceil(diff / minute)} 分钟后`
  if (diff < day) return `${Math.ceil(diff / hour)} 小时后`
  return `${Math.ceil(diff / day)} 天后`
}
