import { STORAGE_KEYS } from "@/lib/storage-keys"
import {
  DEFAULT_SPEECH_PREFERENCES,
  mergeSpeechPreferencesPatch,
  normalizeSpeechPreferences,
  type SpeechUserPreferences,
} from "@/lib/speech-preferences-model"

export type SpeakCallbacks = {
  onStart?: () => void
  onEnd?: () => void
  onError?: (event: SpeechSynthesisErrorEvent) => void
}

export type SpeakOptions = SpeakCallbacks & {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  cancel?: boolean
}

type SpeechDefaults = {
  lang: string
  rate?: number
  pitch?: number
  volume?: number
}

let speechDefaults: SpeechDefaults = {
  lang: "ja-JP",
}

export function setSpeechDefaults(next: Partial<SpeechDefaults>) {
  speechDefaults = { ...speechDefaults, ...next }
}

export function getSpeechDefaults() {
  return speechDefaults
}

export function isSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  )
}

function pickJapaneseVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith("ja")) ??
    voices.find((v) => v.lang?.toLowerCase().includes("ja")) ??
    null
  )
}

function applyUtteranceDefaults(utterance: SpeechSynthesisUtterance, options: SpeakOptions) {
  utterance.lang = options.lang ?? speechDefaults.lang ?? "ja-JP"

  if (typeof options.rate === "number") utterance.rate = options.rate
  else if (typeof speechDefaults.rate === "number") utterance.rate = speechDefaults.rate

  if (typeof options.pitch === "number") utterance.pitch = options.pitch
  else if (typeof speechDefaults.pitch === "number") utterance.pitch = speechDefaults.pitch

  if (typeof options.volume === "number") utterance.volume = options.volume
  else if (typeof speechDefaults.volume === "number") utterance.volume = speechDefaults.volume
}

export function speakJapanese(text: string, options: SpeakOptions = {}) {
  if (!isSpeechSupported()) return null
  if (!text?.trim()) return null

  const synth = window.speechSynthesis
  if (options.cancel !== false) synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  applyUtteranceDefaults(utterance, options)

  const voices = synth.getVoices?.() ?? []
  const voice = pickJapaneseVoice(voices)
  if (voice) utterance.voice = voice

  if (options.onStart) utterance.onstart = options.onStart
  if (options.onEnd) utterance.onend = options.onEnd
  if (options.onError) utterance.onerror = options.onError

  synth.speak(utterance)
  return utterance
}

export type SpeakSequenceOptions = SpeakOptions & {
  gapMs?: number
}

export function speakJapaneseSequence(texts: string[], options: SpeakSequenceOptions = {}) {
  if (!isSpeechSupported()) return null

  const cleaned = (texts ?? []).map((t) => t?.trim()).filter(Boolean) as string[]
  if (!cleaned.length) return null

  const synth = window.speechSynthesis
  if (options.cancel !== false) synth.cancel()

  const voices = synth.getVoices?.() ?? []
  const voice = pickJapaneseVoice(voices)
  const gapMs = typeof options.gapMs === "number" ? Math.max(0, options.gapMs) : 0

  let index = 0
  let first: SpeechSynthesisUtterance | null = null

  const speakNext = () => {
    const current = cleaned[index]
    if (!current) {
      options.onEnd?.()
      return
    }

    const utterance = new SpeechSynthesisUtterance(current)
    applyUtteranceDefaults(utterance, options)
    if (voice) utterance.voice = voice

    if (!first) first = utterance
    if (index === 0 && options.onStart) utterance.onstart = options.onStart

    utterance.onerror = (event) => {
      options.onError?.(event)
      options.onEnd?.()
    }

    utterance.onend = () => {
      index += 1
      if (index >= cleaned.length) {
        options.onEnd?.()
        return
      }

      if (gapMs > 0) setTimeout(speakNext, gapMs)
      else speakNext()
    }

    synth.speak(utterance)
  }

  speakNext()
  return first
}

export type SpeakRepeatOptions = SpeakSequenceOptions & {
  repeat?: number
}

export function speakJapaneseRepeated(text: string, options: SpeakRepeatOptions = {}) {
  const count = typeof options.repeat === "number" ? Math.floor(options.repeat) : 1
  const repeat = Math.max(1, Math.min(5, count))
  const texts = Array.from({ length: repeat }, () => text)
  return speakJapaneseSequence(texts, options)
}

export const DEFAULT_SPEECH_PREFS_STORAGE_KEY = STORAGE_KEYS.SPEECH_PREFS
export { DEFAULT_SPEECH_PREFERENCES, type SpeechUserPreferences } from "@/lib/speech-preferences-model"

export function applySpeechPreferences(prefs: SpeechUserPreferences) {
  setSpeechDefaults({ rate: prefs.rate })
}

export function readSpeechPreferences(
  storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY
): SpeechUserPreferences {
  if (typeof window === "undefined") return DEFAULT_SPEECH_PREFERENCES

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return DEFAULT_SPEECH_PREFERENCES

    return normalizeSpeechPreferences(JSON.parse(raw) as unknown)
  } catch {
    return DEFAULT_SPEECH_PREFERENCES
  }
}

export function writeSpeechPreferences(
  prefs: SpeechUserPreferences,
  storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY
) {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(prefs))
    return true
  } catch {
    return false
  }
}

export function loadSpeechPreferences(storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY) {
  const prefs = readSpeechPreferences(storageKey)
  applySpeechPreferences(prefs)
  return prefs
}

export function updateSpeechPreferences(
  patch: Partial<SpeechUserPreferences>,
  storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY
) {
  const prev = readSpeechPreferences(storageKey)
  const next = mergeSpeechPreferencesPatch(prev, patch)

  if (!writeSpeechPreferences(next, storageKey)) {
    applySpeechPreferences(prev)
    return prev
  }

  applySpeechPreferences(next)
  return next
}

export function resetSpeechPreferences(storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY) {
  const prev = readSpeechPreferences(storageKey)
  if (!writeSpeechPreferences(DEFAULT_SPEECH_PREFERENCES, storageKey)) {
    applySpeechPreferences(prev)
    return prev
  }

  applySpeechPreferences(DEFAULT_SPEECH_PREFERENCES)
  return DEFAULT_SPEECH_PREFERENCES
}
