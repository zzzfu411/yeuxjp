import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const verbs = await loadTsModule("src/lib/verb-conjugation.ts")

test("ichidan verbs drop ru before common beginner forms", () => {
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "masu"), "たべます")
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "nai"), "たべない")
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "te"), "たべて")
  assert.equal(verbs.conjugateVerb("たべる", "ichidan", "ta"), "たべた")
})

test("irregular verbs produce beginner forms", () => {
  assert.equal(verbs.conjugateVerb("くる", "kuru", "masu"), "きます")
  assert.equal(verbs.conjugateVerb("くる", "kuru", "nai"), "こない")
  assert.equal(verbs.conjugateVerb("する", "suru", "te"), "して")
  assert.equal(verbs.conjugateVerb("べんきょうする", "suru", "ta"), "べんきょうした")
})

test("godan iku keeps its te/ta exception", () => {
  assert.equal(verbs.conjugateVerb("いく", "godan", "masu"), "いきます")
  assert.equal(verbs.conjugateVerb("いく", "godan", "nai"), "いかない")
  assert.equal(verbs.conjugateVerb("いく", "godan", "te"), "いって")
  assert.equal(verbs.conjugateVerb("いく", "godan", "ta"), "いった")
})
