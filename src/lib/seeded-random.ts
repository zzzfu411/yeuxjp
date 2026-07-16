function hashSeedValue(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

// Deterministic PRNG (mulberry32). Review question resolution runs inside
// memos whose inputs (mistake map, vocabulary pool) legitimately change right
// after an answer is recorded; deriving all randomness from a stable seed
// keeps a re-resolved current question identical instead of reshuffling its
// direction and options mid-feedback.
export function createSeededRandom(seed: string) {
  let state = hashSeedValue(seed) || 1
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
