import type { VocabLevel } from "@/data/vocabulary/types"

export type QuizMode =
  | "hiragana-romaji"
  | "audio-kana"
  | "audio-sokuon"
  | "audio-longvowel"
  | "verb-conjugation"
  | "particle"
  | "meaning-vocab"

export type KanaQuizScope = "seion" | "all"
export type VocabQuizScope = VocabLevel | "all"

export const QUIZ_MODE_SET = new Set<string>([
  "hiragana-romaji",
  "audio-kana",
  "audio-sokuon",
  "audio-longvowel",
  "verb-conjugation",
  "particle",
  "meaning-vocab",
])

export function parseQuizMode(value: string | null): QuizMode | null {
  if (!value) return null
  return QUIZ_MODE_SET.has(value) ? (value as QuizMode) : null
}
