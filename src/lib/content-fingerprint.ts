// Stable content identity, not a security hash. Keep this algorithm versioned.
export function contentFingerprint(value: unknown) {
  const text = JSON.stringify(value)
  let first = 2166136261
  let second = 5381
  for (let index = 0; index < text.length; index++) {
    first = Math.imul(first ^ text.charCodeAt(index), 16777619)
    second = Math.imul(second, 33) ^ text.charCodeAt(index)
  }
  return `v1-${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`
}
