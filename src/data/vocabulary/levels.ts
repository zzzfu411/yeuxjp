export const VOCABULARY_LEVEL_IDS = ["survival", "daily", "fluent"] as const

export type VocabLevel = (typeof VOCABULARY_LEVEL_IDS)[number]

export type VocabularyLevelMetadata = {
  id: VocabLevel
  label: string
  desc: string
  count: number
  idPrefix: string
}

export const DEFAULT_VOCABULARY_LEVEL: VocabLevel = "survival"

export const VOCABULARY_LEVEL_METADATA = [
  { id: "survival", label: "生存级 (N5)", desc: "购物、问路、自我介绍", count: 544, idPrefix: "sur-" },
  { id: "daily", label: "日常级 (N4-N3)", desc: "生活交流、动漫理解", count: 297, idPrefix: "day-" },
  { id: "fluent", label: "流利级 (N2-N1)", desc: "商务、新闻、深层文化", count: 225, idPrefix: "flu-" },
] as const satisfies readonly VocabularyLevelMetadata[]

export function isVocabLevel(value: unknown): value is VocabLevel {
  return typeof value === "string" && VOCABULARY_LEVEL_IDS.includes(value as VocabLevel)
}

export function mapVocabularyLevels<T>(createValue: (level: VocabLevel) => T): Record<VocabLevel, T> {
  return Object.fromEntries(
    VOCABULARY_LEVEL_IDS.map((level) => [level, createValue(level)])
  ) as Record<VocabLevel, T>
}

export const vocabLevelCounts = mapVocabularyLevels(
  (level) => VOCABULARY_LEVEL_METADATA.find((item) => item.id === level)?.count ?? 0
)

export function getVocabularyLevelMetadata(level: VocabLevel) {
  return VOCABULARY_LEVEL_METADATA.find((item) => item.id === level) ?? null
}
