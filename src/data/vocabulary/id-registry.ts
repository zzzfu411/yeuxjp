import type { VocabLevel } from "./types"

type VocabIdRange = {
  level: VocabLevel
  prefix: string
  from: number
  to: number
}

const VOCAB_ID_RANGES = [
  { level: "survival", prefix: "sur-g-", from: 1, to: 30 },
  { level: "survival", prefix: "sur-v-", from: 1, to: 81 },
  { level: "survival", prefix: "sur-adj-", from: 1, to: 75 },
  { level: "survival", prefix: "sur-p-", from: 1, to: 30 },
  { level: "survival", prefix: "sur-f-", from: 1, to: 50 },
  { level: "survival", prefix: "sur-d-", from: 1, to: 60 },
  { level: "survival", prefix: "sur-n-", from: 1, to: 55 },
  { level: "survival", prefix: "sur-b-", from: 1, to: 20 },
  { level: "survival", prefix: "sur-t-", from: 1, to: 30 },
  { level: "survival", prefix: "sur-c-", from: 1, to: 11 },
  { level: "survival", prefix: "sur-num-", from: 1, to: 10 },
  { level: "survival", prefix: "sur-num-c", from: 1, to: 10 },
  { level: "survival", prefix: "sur-tr-", from: 1, to: 10 },
  { level: "survival", prefix: "sur-dir-", from: 1, to: 10 },
  { level: "survival", prefix: "sur-gw-", from: 1, to: 20 },
  { level: "daily", prefix: "day-v-", from: 1, to: 50 },
  { level: "daily", prefix: "day-abs-", from: 1, to: 30 },
  { level: "daily", prefix: "day-adj-", from: 1, to: 25 },
  { level: "daily", prefix: "day-soc-", from: 1, to: 25 },
  { level: "daily", prefix: "day-med-", from: 1, to: 10 },
  { level: "daily", prefix: "day-hob-", from: 1, to: 10 },
  { level: "daily", prefix: "day-gw-", from: 1, to: 40 },
  { level: "daily", prefix: "day-city-", from: 1, to: 20 },
  { level: "daily", prefix: "day-t-", from: 1, to: 15 },
  { level: "daily", prefix: "day-tr-", from: 1, to: 15 },
  { level: "fluent", prefix: "flu-abs-", from: 1, to: 40 },
  { level: "fluent", prefix: "flu-gw-", from: 1, to: 20 },
  { level: "fluent", prefix: "flu-emo-", from: 1, to: 20 },
  { level: "fluent", prefix: "flu-biz-", from: 1, to: 50 },
  { level: "fluent", prefix: "flu-soc-", from: 1, to: 30 },
  { level: "fluent", prefix: "flu-tech-", from: 1, to: 15 },
  { level: "fluent", prefix: "flu-cul-", from: 1, to: 20 },
] as const satisfies readonly VocabIdRange[]

const EXACT_VOCAB_IDS = new Map<string, VocabLevel>([
  ["sur-num-100", "survival"],
  ["sur-num-1000", "survival"],
  ["sur-num-10000", "survival"],
])

function getRangeNumberSuffix(id: string, prefix: string) {
  if (!id.startsWith(prefix)) return null
  const suffix = id.slice(prefix.length)
  if (!/^[1-9]\d*$/.test(suffix)) return null
  return Number(suffix)
}

export function getKnownVocabularyLevelForId(id: string): VocabLevel | null {
  const exactLevel = EXACT_VOCAB_IDS.get(id)
  if (exactLevel) return exactLevel

  for (const range of VOCAB_ID_RANGES) {
    const value = getRangeNumberSuffix(id, range.prefix)
    if (value == null) continue
    if (value >= range.from && value <= range.to) return range.level
  }

  return null
}

export function isKnownVocabularyId(id: string) {
  return getKnownVocabularyLevelForId(id) !== null
}
