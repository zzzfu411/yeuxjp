import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/speech-preferences-model.ts")

test("speech preference model normalizes legacy fields and clamps ranges", () => {
  assert.deepEqual(
    model.normalizeSpeechPreferences({
      rate: 2,
      quizRepeat: 3,
      quizAutoPlay: false,
      quizGapMs: 5000,
    }),
    {
      rate: 1.2,
      repeat: 3,
      autoPlay: false,
      gapMs: 2000,
    }
  )
})

test("speech preference model falls back for invalid stored values", () => {
  assert.deepEqual(model.normalizeSpeechPreferences(null), model.DEFAULT_SPEECH_PREFERENCES)
  assert.deepEqual(
    model.normalizeSpeechPreferences({
      rate: "fast",
      repeat: 7,
      autoPlay: "yes",
      gapMs: -100,
    }),
    {
      rate: model.DEFAULT_SPEECH_PREFERENCES.rate,
      repeat: model.DEFAULT_SPEECH_PREFERENCES.repeat,
      autoPlay: model.DEFAULT_SPEECH_PREFERENCES.autoPlay,
      gapMs: 0,
    }
  )
  assert.deepEqual(
    model.normalizeSpeechPreferences({
      rate: Number.NaN,
      repeat: 2,
      autoPlay: false,
      gapMs: Number.POSITIVE_INFINITY,
    }),
    {
      rate: model.DEFAULT_SPEECH_PREFERENCES.rate,
      repeat: 2,
      autoPlay: false,
      gapMs: model.DEFAULT_SPEECH_PREFERENCES.gapMs,
    }
  )
})

test("speech preference patch merging preserves current values and clamps changed ones", () => {
  const current = { rate: 0.85, repeat: 2, autoPlay: false, gapMs: 400 }

  assert.deepEqual(model.mergeSpeechPreferencesPatch(current, { rate: 9, repeat: 1, autoPlay: true }), {
    rate: 1.2,
    repeat: 1,
    autoPlay: true,
    gapMs: 400,
  })

  assert.deepEqual(model.mergeSpeechPreferencesPatch(current, { repeat: 99, gapMs: 5000 }), {
    rate: 0.85,
    repeat: 2,
    autoPlay: false,
    gapMs: 2000,
  })

  assert.deepEqual(model.mergeSpeechPreferencesPatch(current, { rate: Number.NaN, gapMs: Number.NEGATIVE_INFINITY }), {
    rate: 0.85,
    repeat: 2,
    autoPlay: false,
    gapMs: 400,
  })

  assert.deepEqual(
    model.mergeSpeechPreferencesPatch({ rate: Number.NaN, repeat: 2, autoPlay: false, gapMs: Number.POSITIVE_INFINITY }, {}),
    {
      rate: model.DEFAULT_SPEECH_PREFERENCES.rate,
      repeat: 2,
      autoPlay: false,
      gapMs: model.DEFAULT_SPEECH_PREFERENCES.gapMs,
    }
  )
})
