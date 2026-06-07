import type { Kana } from "@/data/kana-data"

export type KanaSet = "seion" | "dakuon" | "yoon" | "special" | "all"

export const KANA_SET_VALUES: readonly KanaSet[] = ["seion", "dakuon", "yoon", "special", "all"]

export const KANA_ROWS = {
  seion: ["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa", "n"],
  dakuon: ["ga", "za", "da", "ba", "pa"],
  yoon: ["ky", "gy", "sh", "j", "ch", "ny", "hy", "by", "py", "my", "ry"],
  special: ["special"],
} as const

export function parseKanaSet(value: string | null): KanaSet | null {
  if (!value) return null
  return KANA_SET_VALUES.includes(value as KanaSet) ? (value as KanaSet) : null
}

export function getKanaSetData(data: Kana[], kanaSet: KanaSet) {
  if (kanaSet === "seion") return data.filter((item) => item.type === "seion")
  if (kanaSet === "dakuon") return data.filter((item) => item.type === "dakuon" || item.type === "handakuon")
  if (kanaSet === "yoon") return data.filter((item) => item.type === "yoon")
  if (kanaSet === "special") return data.filter((item) => item.type === "special")
  return data
}

export function filterKanaByProgress(data: Kana[], onlyUnmastered: boolean, isMastered: (romaji: string) => boolean) {
  return onlyUnmastered ? data.filter((item) => !isMastered(item.romaji)) : data
}

export function getKanaRowsForData(rows: readonly string[], data: Kana[]) {
  return rows.filter((row) => data.some((item) => item.row === row))
}

export function getKanaProgress(data: Kana[], isMastered: (romaji: string) => boolean) {
  return {
    learned: data.reduce((total, item) => total + (isMastered(item.romaji) ? 1 : 0), 0),
    total: data.length,
  }
}
