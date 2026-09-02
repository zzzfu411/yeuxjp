import { STORAGE_KEYS } from "@/lib/storage-keys"
import { writeManagedLearningStorage } from "@/lib/managed-learning-storage"
import {
  DEFAULT_SPEECH_PREFERENCES,
  mergeSpeechPreferencesPatch,
  normalizeSpeechPreferences,
  type SpeechUserPreferences,
} from "@/lib/speech-preferences-model"
import {
  buildRepeatedSpeechTexts,
  normalizeSpeechGapMs,
  normalizeSpeechSequenceTexts,
  pickJapaneseVoice,
} from "@/lib/speech-playback-model"
import {
  canWriteJsonStorage,
  invalidJsonStorageValue,
  readJsonStorage,
  validJsonStorageValue,
  type JsonStorageWriteOptions,
} from "@/lib/storage-read-result"

export type SpeakCallbacks = {
  onStart?: () => void
  onEnd?: () => void
  onError?: (event: SpeechSynthesisErrorEvent) => void
  onCancel?: () => void
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
// Sequence playback chains utterances through onend callbacks and gap timers.
// speechSynthesis.cancel() clears the utterance queue but cannot clear a
// pending gap timer, so an interrupted sequence would otherwise "revive" and
// speak its remaining repeats over the next prompt. Every new playback (or
// explicit cancel) bumps the generation; stale chains check it and stop.
let speechGeneration = 0
let activeUtterance: SpeechSynthesisUtterance | null = null
let activePlaybackCancel: (() => void) | null = null

function nextSpeechGeneration() {
  speechGeneration += 1
  return speechGeneration
}
function clearActivePlayback(utterance?: SpeechSynthesisUtterance) {
  if (utterance && activeUtterance && activeUtterance !== utterance) return
  activeUtterance = null
  activePlaybackCancel = null
}
function cancelActivePlayback() {
  const onCancel = activePlaybackCancel
  clearActivePlayback()
  onCancel?.()
}
export function cancelJapaneseSpeech(expected?: SpeechSynthesisUtterance) {
  if (expected && activeUtterance !== expected) return

  nextSpeechGeneration()
  cancelActivePlayback()
  if (!isSpeechSupported()) return
  window.speechSynthesis.cancel()
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
  const generation = options.cancel !== false ? nextSpeechGeneration() : speechGeneration
  if (options.cancel !== false) {
    cancelActivePlayback()
    synth.cancel()
  }
  const utterance = new SpeechSynthesisUtterance(text)
  applyUtteranceDefaults(utterance, options)
  const voices = synth.getVoices?.() ?? []
  const voice = pickJapaneseVoice(voices)
  if (voice) utterance.voice = voice
  if (options.onStart) utterance.onstart = () => { if (generation === speechGeneration) options.onStart?.() }
  utterance.onend = () => {
    if (generation !== speechGeneration) return
    clearActivePlayback(utterance)
    options.onEnd?.()
  }
  utterance.onerror = (event) => {
    if (generation !== speechGeneration) return
    nextSpeechGeneration()
    clearActivePlayback(utterance)
    options.onError?.(event)
  }
  activeUtterance = utterance
  activePlaybackCancel = options.onCancel ?? null
  synth.speak(utterance)
  return utterance
}
export type SpeakSequenceOptions = SpeakOptions & {
  gapMs?: number
}
export function speakJapaneseSequence(texts: string[], options: SpeakSequenceOptions = {}) {
  if (!isSpeechSupported()) return null

  const cleaned = normalizeSpeechSequenceTexts(texts)
  if (!cleaned.length) return null

  const synth = window.speechSynthesis
  const generation = nextSpeechGeneration()
  cancelActivePlayback()
  if (options.cancel !== false) {
    synth.cancel()
  }
  const voices = synth.getVoices?.() ?? []
  const voice = pickJapaneseVoice(voices)
  const gapMs = normalizeSpeechGapMs(options.gapMs)

  let index = 0
  let first: SpeechSynthesisUtterance | null = null
  const speakNext = () => {
    if (generation !== speechGeneration) return

    const current = cleaned[index]
    if (!current) {
      clearActivePlayback()
      options.onEnd?.()
      return
    }
    const utterance = new SpeechSynthesisUtterance(current)
    applyUtteranceDefaults(utterance, options)
    if (voice) utterance.voice = voice

    if (!first) first = utterance
    if (index === 0 && options.onStart) utterance.onstart = () => { if (generation === speechGeneration) options.onStart?.() }

    utterance.onerror = (event) => {
      if (generation !== speechGeneration) return
      nextSpeechGeneration()
      clearActivePlayback(utterance)
      options.onError?.(event)
      options.onEnd?.()
    }

    utterance.onend = () => {
      if (generation !== speechGeneration) return

      if (activeUtterance === utterance) activeUtterance = null
      index += 1
      if (index >= cleaned.length) {
        clearActivePlayback(utterance)
        options.onEnd?.()
        return
      }

      if (gapMs > 0) setTimeout(speakNext, gapMs)
      else speakNext()
    }

    activeUtterance = utterance
    activePlaybackCancel = options.onCancel ?? null
    synth.speak(utterance)
  }

  speakNext()
  return first
}
export type SpeakRepeatOptions = SpeakSequenceOptions & {
  repeat?: number
}
export function speakJapaneseRepeated(text: string, options: SpeakRepeatOptions = {}) {
  const texts = buildRepeatedSpeechTexts(text, options.repeat)
  return speakJapaneseSequence(texts, options)
}
export const DEFAULT_SPEECH_PREFS_STORAGE_KEY = STORAGE_KEYS.SPEECH_PREFS
export const SPEECH_PREFS_EVENT = "yasashi:speech-preferences:update"
export { DEFAULT_SPEECH_PREFERENCES, type SpeechUserPreferences } from "@/lib/speech-preferences-model"
export function applySpeechPreferences(prefs: SpeechUserPreferences) {
  setSpeechDefaults({ rate: prefs.rate })
}

export function readSpeechPreferences(
  storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY
): SpeechUserPreferences {
  return readSpeechPreferencesResult(storageKey).value
}

export function readSpeechPreferencesResult(storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY) {
  return readJsonStorage(
    storageKey,
    DEFAULT_SPEECH_PREFERENCES,
    (input) => input && typeof input === "object" && !Array.isArray(input)
      ? validJsonStorageValue(normalizeSpeechPreferences(input))
      : invalidJsonStorageValue<SpeechUserPreferences>(),
    "speech-preferences"
  )
}

export function writeSpeechPreferences(
  prefs: SpeechUserPreferences,
  storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY,
  options: JsonStorageWriteOptions = {}
) {
  if (typeof window === "undefined") return false
  if (!canWriteJsonStorage(readSpeechPreferencesResult(storageKey), options)) return false
  try {
    writeManagedLearningStorage(storageKey, JSON.stringify(prefs))
    return true
  } catch {
    return false
  }
}

export function notifySpeechPreferences(storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(SPEECH_PREFS_EVENT, { detail: { storageKey } }))
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
  return updateSpeechPreferencesWithStatus(patch, storageKey).prefs
}

export function updateSpeechPreferencesWithStatus(
  patch: Partial<SpeechUserPreferences>,
  storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY
) {
  const current = readSpeechPreferencesResult(storageKey)
  if (!current.ok) return { prefs: current.value, saved: false }
  const prev = current.value
  const next = mergeSpeechPreferencesPatch(prev, patch)

  if (!writeSpeechPreferences(next, storageKey, { expectedRaw: current.raw })) {
    applySpeechPreferences(prev)
    return { prefs: prev, saved: false }
  }

  applySpeechPreferences(next)
  notifySpeechPreferences(storageKey)
  return { prefs: next, saved: true }
}

export function resetSpeechPreferences(storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY) {
  return resetSpeechPreferencesWithStatus(storageKey).prefs
}

export function resetSpeechPreferencesWithStatus(storageKey: string = DEFAULT_SPEECH_PREFS_STORAGE_KEY) {
  const prev = readSpeechPreferences(storageKey)
  if (!writeSpeechPreferences(DEFAULT_SPEECH_PREFERENCES, storageKey, { replaceInvalid: true })) {
    applySpeechPreferences(prev)
    return { prefs: prev, saved: false }
  }

  applySpeechPreferences(DEFAULT_SPEECH_PREFERENCES)
  notifySpeechPreferences(storageKey)
  return { prefs: DEFAULT_SPEECH_PREFERENCES, saved: true }
}
