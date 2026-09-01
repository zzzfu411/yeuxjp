import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

class FakeUtterance {
  constructor(text) {
    this.text = text
  }
}

function installFakeSpeech() {
  const spoken = []
  const synth = {
    cancelCount: 0,
    getVoices: () => [],
    cancel() {
      this.cancelCount += 1
    },
    speak(utterance) {
      spoken.push(utterance)
    },
  }
  globalThis.window = { speechSynthesis: synth }
  globalThis.SpeechSynthesisUtterance = FakeUtterance
  return { spoken, synth }
}

const { spoken, synth } = installFakeSpeech()
const speech = await loadTsModule("src/lib/speech.ts")

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

test("speech sequences chain through onend until every text is spoken", () => {
  spoken.length = 0

  const ended = []
  speech.speakJapaneseSequence(["あ", "い", "う"], { gapMs: 0, onEnd: () => ended.push(true) })

  assert.equal(spoken.length, 1)
  spoken[0].onend()
  assert.equal(spoken.length, 2)
  spoken[1].onend()
  assert.equal(spoken.length, 3)
  spoken[2].onend()
  assert.equal(ended.length, 1)
  assert.deepEqual(spoken.map((utterance) => utterance.text), ["あ", "い", "う"])
})

test("a newer playback invalidates a pending sequence gap timer", async () => {
  spoken.length = 0

  speech.speakJapaneseSequence(["おはよう", "おはよう"], { gapMs: 1 })
  assert.equal(spoken.length, 1)
  // First repeat finished; the second repeat is now waiting on the gap timer.
  spoken[0].onend()

  // A new prompt starts before the gap timer fires.
  speech.speakJapaneseSequence(["こんにちは"], { gapMs: 1 })
  assert.equal(spoken.length, 2)
  assert.equal(spoken[1].text, "こんにちは")

  await sleep(10)
  assert.deepEqual(
    spoken.map((utterance) => utterance.text),
    ["おはよう", "こんにちは"],
    "the stale gap timer must not revive the interrupted sequence"
  )
})

test("cancelJapaneseSpeech stops a sequence from continuing after unmount", () => {
  spoken.length = 0

  const ended = []
  speech.speakJapaneseSequence(["さよなら", "さよなら"], { gapMs: 0, onEnd: () => ended.push(true) })
  assert.equal(spoken.length, 1)

  speech.cancelJapaneseSpeech()
  // Browsers fire onend/onerror for cancelled utterances; the stale chain
  // must ignore it instead of speaking the remaining repeats.
  spoken[0].onend()

  assert.equal(spoken.length, 1)
  assert.equal(ended.length, 0)
})

test("speakJapanese interrupts and invalidates an in-flight sequence chain", () => {
  spoken.length = 0

  speech.speakJapaneseSequence(["ねこ", "ねこ"], { gapMs: 0 })
  assert.equal(spoken.length, 1)

  speech.speakJapanese("いぬ")
  assert.equal(spoken.length, 2)

  spoken[0].onend()
  assert.equal(spoken.length, 2, "the interrupted sequence must not enqueue its second repeat")
  assert.equal(spoken[1].text, "いぬ")
})

test("stale button cleanup cannot cancel newer speech playback", () => {
  spoken.length = 0

  const first = speech.speakJapanese("一")
  const second = speech.speakJapanese("二")
  const cancelCountBeforeStaleCleanup = synth.cancelCount

  speech.cancelJapaneseSpeech(first)
  assert.equal(synth.cancelCount, cancelCountBeforeStaleCleanup)
  assert.equal(spoken.length, 2)

  speech.cancelJapaneseSpeech(second)
  assert.equal(synth.cancelCount, cancelCountBeforeStaleCleanup + 1)
})
