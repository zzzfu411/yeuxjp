export function shuffleList<T>(list: readonly T[], random: () => number = Math.random) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
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
  const targetValue = getValue(target)
  const seen = new Set([targetValue])
  const wrong: T[] = []

  for (const item of shuffleList(pool, random)) {
    const value = getValue(item)
    if (seen.has(value)) continue
    seen.add(value)
    wrong.push(item)
    if (wrong.length >= optionCount - 1) break
  }

  if (wrong.length < optionCount - 1) return null
  return shuffleList([target, ...wrong], random)
}
