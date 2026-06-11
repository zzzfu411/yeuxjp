export type SpeechVoiceLike = {
  lang?: string
}

export function normalizeSpeechSequenceTexts(texts: readonly (string | null | undefined)[]) {
  return texts.map((text) => text?.trim()).filter(Boolean) as string[]
}

export function normalizeSpeechGapMs(value: unknown) {
  return typeof value === "number" ? Math.max(0, value) : 0
}

export function normalizeSpeechRepeat(value: unknown) {
  const count = typeof value === "number" ? Math.floor(value) : 1
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
