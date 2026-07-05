export function safeRandomIndex(random: () => number, size: number) {
  if (!Number.isFinite(size) || size <= 0) return -1
  const value = random()
  const safeValue = typeof value === "number" && Number.isFinite(value) ? value : 0
  const clamped = Math.max(0, Math.min(1 - Number.EPSILON, safeValue))
  return Math.floor(clamped * Math.floor(size))
}

export function pickRandomListItem<T>(items: readonly T[], random: () => number = Math.random) {
  const index = safeRandomIndex(random, items.length)
  return index >= 0 ? items[index] ?? null : null
}

function normalizeOptionCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(2, Math.floor(value)) : 4
}

export function shuffleList<T>(list: readonly T[], random: () => number = Math.random) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = safeRandomIndex(random, i + 1)
    const tmp = arr[i]
    arr[i] = arr[j]!
    arr[j] = tmp!
  }
  return arr
}

export function pickUniqueQuestionOptions<T>({
  target,
  pool,
  getValue,
  random = Math.random,
  optionCount = 4,
}: {
  target: T
  pool: readonly T[]
  getValue: (item: T) => string
  random?: () => number
  optionCount?: number
}) {
  const count = normalizeOptionCount(optionCount)
  const targetValue = getValue(target)
  const seen = new Set([targetValue])
  const wrong: T[] = []

  for (const item of shuffleList(pool, random)) {
    const value = getValue(item)
    if (seen.has(value)) continue
    seen.add(value)
    wrong.push(item)
    if (wrong.length >= count - 1) break
  }

  if (wrong.length < count - 1) return null
  return shuffleList([target, ...wrong], random)
}
