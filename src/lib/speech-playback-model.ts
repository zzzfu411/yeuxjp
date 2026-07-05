export type SpeechVoiceLike = {
  lang?: string
}

export function normalizeSpeechSequenceTexts(texts: readonly (string | null | undefined)[]) {
  return texts.map((text) => text?.trim()).filter(Boolean) as string[]
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

export function normalizeSpeechGapMs(value: unknown) {
  return Math.max(0, finiteNumber(value, 0))
}

export function normalizeSpeechRepeat(value: unknown) {
  const count = Math.floor(finiteNumber(value, 1))
  return Math.max(1, Math.min(5, count))
}

export function buildRepeatedSpeechTexts(text: string, repeat: unknown) {
  return Array.from({ length: normalizeSpeechRepeat(repeat) }, () => text)
}

export function pickJapaneseVoice<T extends SpeechVoiceLike>(voices: readonly T[]) {
  return (
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("ja")) ??
    voices.find((voice) => voice.lang?.toLowerCase().includes("ja")) ??
    null
  )
}
