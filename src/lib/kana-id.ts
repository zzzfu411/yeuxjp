import { kanaData, type Kana } from "@/data/kana-data"

export const KANA_SCRIPTS = ["hiragana", "katakana"] as const

export type KanaScript = (typeof KANA_SCRIPTS)[number]
export type KanaId = `${KanaScript}:${string}`

export type ParsedKanaId = {
  id: KanaId
  script: KanaScript
  romaji: string
  kana: Kana
}

const kanaByRomaji = new Map(kanaData.map((item) => [item.romaji, item]))

export const ALL_KANA_IDS: readonly KanaId[] = kanaData.flatMap((item) =>
  KANA_SCRIPTS.map((script) => `${script}:${item.romaji}` as KanaId)
)

export function isKanaScript(value: unknown): value is KanaScript {
  return value === "hiragana" || value === "katakana"
}

export function isKanaRomaji(value: unknown): value is string {
  return typeof value === "string" && kanaByRomaji.has(value)
}

export function makeKanaId(script: KanaScript, romaji: string): KanaId | null {
  if (!isKanaRomaji(romaji)) return null
  return `${script}:${romaji}`
}

export function parseKanaId(value: unknown): ParsedKanaId | null {
  if (typeof value !== "string") return null
  const separator = value.indexOf(":")
  if (separator <= 0 || separator !== value.lastIndexOf(":")) return null

  const script = value.slice(0, separator)
  const romaji = value.slice(separator + 1)
  if (!isKanaScript(script) || !isKanaRomaji(romaji)) return null

  return {
    id: `${script}:${romaji}`,
    script,
    romaji,
    kana: kanaByRomaji.get(romaji)!,
  }
}

export function isKanaId(value: unknown): value is KanaId {
  return parseKanaId(value) !== null
}

export function getKanaById(value: unknown): ParsedKanaId | null {
  return parseKanaId(value)
}

export function getKanaGlyph(value: unknown): string | null {
  const parsed = parseKanaId(value)
  return parsed ? parsed.kana[parsed.script] : null
}

export function expandLegacyKanaId(value: unknown): KanaId[] {
  if (typeof value !== "string") return []
  const normalized = value.trim()
  const parsed = parseKanaId(normalized)
  if (parsed) return [parsed.id]
  if (!isKanaRomaji(normalized)) return []
  return KANA_SCRIPTS.map((script) => `${script}:${normalized}` as KanaId)
}

export function normalizeKanaIdList(input: Iterable<unknown>): KanaId[] {
  const normalized = new Set<KanaId>()
  for (const value of input) {
    for (const id of expandLegacyKanaId(value)) normalized.add(id)
  }
  return Array.from(normalized)
}

export function normalizeKanaIdRecord<T>(input: Record<string, T>): Partial<Record<KanaId, T>> {
  const normalized: Partial<Record<KanaId, T>> = {}

  // Explicit script-aware state wins over a legacy shared value.
  for (const [rawId, value] of Object.entries(input)) {
    const parsed = parseKanaId(rawId.trim())
    if (parsed) normalized[parsed.id] = value
  }

  for (const [rawId, value] of Object.entries(input)) {
    if (parseKanaId(rawId.trim())) continue
    for (const id of expandLegacyKanaId(rawId)) {
      if (!(id in normalized)) normalized[id] = value
    }
  }

  return normalized
}

export function normalizeKanaPracticeRecord(input: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  const isKanaProgress = (value: unknown) =>
    !!value && typeof value === "object" && (value as { itemType?: unknown }).itemType === "kana"
  const explicitIds = new Set<string>(
    Object.entries(input)
      .filter(([, value]) => isKanaProgress(value))
      .map(([id]) => parseKanaId(id)?.id)
      .filter((id) => !!id)
  )

  for (const [rawId, value] of Object.entries(input)) {
    if (!isKanaProgress(value)) {
      normalized[rawId] = value
      continue
    }
    const expanded = expandLegacyKanaId(rawId)
    const ids = expanded.length ? expanded : [rawId]
    for (const id of ids) {
      if (expanded.length > 1 && explicitIds.has(id)) continue
      normalized[id] = value
    }
  }

  return normalized
}

export function inferKanaScriptFromText(...values: unknown[]): KanaScript | null {
  for (const value of values) {
    if (typeof value !== "string") continue
    if (/\p{Script=Katakana}/u.test(value)) return "katakana"
    if (/\p{Script=Hiragana}/u.test(value)) return "hiragana"
  }
  return null
}

export function resolveKanaId(value: unknown, script: KanaScript = "hiragana"): KanaId | null {
  const parsed = parseKanaId(value)
  if (parsed) return parsed.id
  if (typeof value !== "string") return null
  return makeKanaId(script, value.trim())
}

export function normalizeKanaPracticeItemId(
  value: unknown,
  {
    scriptHint,
    textHints = [],
  }: {
    scriptHint?: KanaScript | null
    textHints?: readonly unknown[]
  } = {}
): string | null {
  const parsed = parseKanaId(value)
  if (parsed) return parsed.id
  if (typeof value !== "string" || !value.trim()) return null

  const normalized = value.trim()
  if (!isKanaRomaji(normalized)) return normalized
  return makeKanaId(scriptHint ?? inferKanaScriptFromText(...textHints) ?? "hiragana", normalized)
}

export function normalizeKanaPracticeResultItemId(item: {
  itemId?: unknown
  itemType?: unknown
  lessonStepId?: unknown
  answer?: unknown
}) {
  if (item.itemType !== "kana") return typeof item.itemId === "string" ? item.itemId : null
  return normalizeKanaPracticeItemId(item.itemId, {
    scriptHint: typeof item.lessonStepId === "string" && item.lessonStepId.startsWith("katakana-") ? "katakana" : null,
    textHints: [item.answer],
  })
}
