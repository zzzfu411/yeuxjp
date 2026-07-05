import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/speech-playback-model.ts")

test("speech playback model trims empty sequence entries", () => {
  assert.deepEqual(model.normalizeSpeechSequenceTexts(["  こんにちは  ", "", "  ", null, undefined, "さようなら"]), [
    "こんにちは",
    "さようなら",
  ])
})

test("speech playback model clamps repeat and gap settings", () => {
  assert.equal(model.normalizeSpeechRepeat(undefined), 1)
  assert.equal(model.normalizeSpeechRepeat(0), 1)
  assert.equal(model.normalizeSpeechRepeat(2.9), 2)
  assert.equal(model.normalizeSpeechRepeat(12), 5)
  assert.equal(model.normalizeSpeechRepeat(Number.NaN), 1)
  assert.equal(model.normalizeSpeechRepeat(Number.POSITIVE_INFINITY), 1)
  assert.equal(model.normalizeSpeechGapMs(undefined), 0)
  assert.equal(model.normalizeSpeechGapMs(-200), 0)
  assert.equal(model.normalizeSpeechGapMs(350), 350)
  assert.equal(model.normalizeSpeechGapMs(Number.NaN), 0)
  assert.equal(model.normalizeSpeechGapMs(Number.POSITIVE_INFINITY), 0)
})

test("speech playback model builds repeated utterance text arrays", () => {
  assert.deepEqual(model.buildRepeatedSpeechTexts("かな", 3), ["かな", "かな", "かな"])
  assert.deepEqual(model.buildRepeatedSpeechTexts("かな", 99), ["かな", "かな", "かな", "かな", "かな"])
})

test("speech playback model prefers Japanese voices by language tag", () => {
  const voices = [
    { name: "English", lang: "en-US" },
    { name: "Mixed", lang: "x-ja-fallback" },
    { name: "Japanese", lang: "ja-JP" },
  ]

  assert.equal(model.pickJapaneseVoice(voices).name, "Japanese")
  assert.equal(model.pickJapaneseVoice(voices.slice(0, 2)).name, "Mixed")
  assert.equal(model.pickJapaneseVoice([{ name: "English", lang: "en-US" }]), null)
})
