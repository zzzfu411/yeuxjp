import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const speech = await loadTsModule("src/lib/speech.ts")
const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

function installWindow({ failWrites = false } = {}) {
  const map = new Map()
  const events = []
  global.window = {
    localStorage: {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => {
        if (failWrites) throw new Error(`write failed: ${key}`)
        map.set(key, String(value))
      },
    },
    dispatchEvent: (event) => {
      events.push(event)
      return true
    },
  }
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, init) {
      super(type)
      this.detail = init?.detail
    }
  }

  return { map, events }
}

test("speech preferences read legacy quiz fields and clamp values", () => {
  const { map } = installWindow()
  map.set("speech", JSON.stringify({
    rate: 2,
    quizRepeat: 3,
    quizAutoPlay: false,
    quizGapMs: 5000,
  }))

  assert.deepEqual(speech.readSpeechPreferences("speech"), {
    rate: 1.2,
    repeat: 3,
    autoPlay: false,
    gapMs: 2000,
  })
})

test("speech preference updates persist and apply defaults", () => {
  const { map, events } = installWindow()

  const next = speech.updateSpeechPreferences({ rate: 0.75, repeat: 2 }, "speech")

  assert.equal(next.rate, 0.75)
  assert.equal(next.repeat, 2)
  assert.equal(JSON.parse(map.get("speech")).rate, 0.75)
  assert.equal(speech.getSpeechDefaults().rate, 0.75)
  assert.equal(events.length, 1)
  assert.equal(events[0].type, speech.SPEECH_PREFS_EVENT)
  assert.deepEqual(events[0].detail, { storageKey: "speech" })
})

test("speech preference update failures keep the previous readable preference", () => {
  const { map, events } = installWindow()
  map.set("speech", JSON.stringify({ rate: 0.85, repeat: 2, autoPlay: false, gapMs: 400 }))

  global.window.localStorage.setItem = () => {
    throw new Error("write failed")
  }

  const next = speech.updateSpeechPreferences({ rate: 1.0, repeat: 3 }, "speech")

  assert.deepEqual(next, { rate: 0.85, repeat: 2, autoPlay: false, gapMs: 400 })
  assert.equal(JSON.parse(map.get("speech")).rate, 0.85)
  assert.equal(speech.getSpeechDefaults().rate, 0.85)
  assert.equal(events.length, 0)
})

test("speech preference reset failures do not report default preferences", () => {
  const { map, events } = installWindow()
  map.set("speech", JSON.stringify({ rate: 0.75, repeat: 3, autoPlay: false, gapMs: 100 }))

  global.window.localStorage.setItem = () => {
    throw new Error("write failed")
  }

  const next = speech.resetSpeechPreferences("speech")

  assert.deepEqual(next, { rate: 0.75, repeat: 3, autoPlay: false, gapMs: 100 })
  assert.equal(JSON.parse(map.get("speech")).repeat, 3)
  assert.equal(speech.getSpeechDefaults().rate, 0.75)
  assert.equal(events.length, 0)
})

test("speech preference resets persist defaults and notify listeners", () => {
  const { map, events } = installWindow()
  map.set("speech", JSON.stringify({ rate: 0.75, repeat: 3, autoPlay: false, gapMs: 100 }))

  const next = speech.resetSpeechPreferences("speech")

  assert.deepEqual(next, speech.DEFAULT_SPEECH_PREFERENCES)
  assert.deepEqual(JSON.parse(map.get("speech")), speech.DEFAULT_SPEECH_PREFERENCES)
  assert.equal(events.length, 1)
  assert.equal(events[0].type, speech.SPEECH_PREFS_EVENT)
  assert.deepEqual(events[0].detail, { storageKey: "speech" })
})

test("speech preference writes report persistence failures to callers", () => {
  const source = read("src/lib/speech.ts")

  assert.match(source, /export function writeSpeechPreferences/)
  assert.match(source, /from "@\/lib\/speech-preferences-model"/)
  assert.match(source, /from "@\/lib\/speech-playback-model"/)
  assert.match(source, /normalizeSpeechPreferences\(JSON\.parse\(raw\) as unknown\)/)
  assert.match(source, /mergeSpeechPreferencesPatch\(prev, patch\)/)
  assert.match(source, /normalizeSpeechSequenceTexts\(texts\)/)
  assert.match(source, /buildRepeatedSpeechTexts\(text, options\.repeat\)/)
  assert.match(source, /return true/)
  assert.match(source, /return false/)
  assert.match(source, /SPEECH_PREFS_EVENT/)
  assert.match(source, /notifySpeechPreferences\(storageKey\)/)
  assert.match(source, /if \(!writeSpeechPreferences\(next, storageKey\)\)/)
  assert.match(source, /if \(!writeSpeechPreferences\(DEFAULT_SPEECH_PREFERENCES, storageKey\)\)/)
})
