export type SpeechUserPreferences = {
  rate: number
  repeat: 1 | 2 | 3
  autoPlay: boolean
  gapMs: number
}

export const DEFAULT_SPEECH_PREFERENCES: SpeechUserPreferences = {
  rate: 0.9,
  repeat: 1,
  autoPlay: true,
  gapMs: 250,
}

function clampRepeat(value: unknown, fallback: 1 | 2 | 3 = DEFAULT_SPEECH_PREFERENCES.repeat): 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3 ? value : fallback
}

function clampRate(value: unknown, fallback = DEFAULT_SPEECH_PREFERENCES.rate) {
  const rate = typeof value === "number" ? value : fallback
  return Math.max(0.6, Math.min(1.2, rate))
}

function clampGapMs(value: unknown, fallback = DEFAULT_SPEECH_PREFERENCES.gapMs) {
  const gapMs = typeof value === "number" ? value : fallback
  return Math.max(0, Math.min(2000, gapMs))
}

export function normalizeSpeechPreferences(raw: unknown): SpeechUserPreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_SPEECH_PREFERENCES

  const obj = raw as Record<string, unknown>

  return {
    rate: clampRate(obj.rate),
    repeat: clampRepeat(obj.repeat ?? obj.quizRepeat),
    autoPlay:
      typeof obj.autoPlay === "boolean"
        ? obj.autoPlay
        : typeof obj.quizAutoPlay === "boolean"
          ? obj.quizAutoPlay
          : DEFAULT_SPEECH_PREFERENCES.autoPlay,
    gapMs: clampGapMs(obj.gapMs ?? obj.quizGapMs),
  }
}

export function mergeSpeechPreferencesPatch(
  current: SpeechUserPreferences,
  patch: Partial<SpeechUserPreferences>
): SpeechUserPreferences {
  return {
    rate: clampRate(patch.rate, current.rate),
    repeat: clampRepeat(patch.repeat, current.repeat),
    autoPlay: typeof patch.autoPlay === "boolean" ? patch.autoPlay : current.autoPlay,
    gapMs: clampGapMs(patch.gapMs, current.gapMs),
  }
}
