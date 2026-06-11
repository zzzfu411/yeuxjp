import type { QuizMode } from "@/lib/quiz-types"

export type QuizEmptyReason = "loading" | "load-error" | "filter-empty" | "pool-too-small"

export function getQuizPreflightEmptyReason({
  mode,
  vocabLoading,
  vocabError,
}: {
  mode: QuizMode
  vocabLoading: boolean
  vocabError: boolean
}): QuizEmptyReason | null {
  if (mode !== "meaning-vocab") return null
  if (vocabError) return "load-error"
  if (vocabLoading) return "loading"
  return null
}

export function getQuizNoQuestionReason({
  mode,
  onlyUnmasteredKana,
  onlyUnlearnedVocab,
}: {
  mode: QuizMode
  onlyUnmasteredKana: boolean
  onlyUnlearnedVocab: boolean
}): QuizEmptyReason {
  if ((mode === "hiragana-romaji" || mode === "audio-kana") && onlyUnmasteredKana) {
    return "filter-empty"
  }

  if (mode === "meaning-vocab" && onlyUnlearnedVocab) {
    return "filter-empty"
  }

  return "pool-too-small"
}

export function shouldShowQuizSpeechOptions(mode: QuizMode) {
  return mode === "audio-kana" || mode === "audio-sokuon" || mode === "audio-longvowel" || mode === "particle"
}
