import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const romaji = await loadTsModule("src/lib/romaji-visibility.ts")

test("romaji visibility defaults follow onboarding mode", () => {
  assert.equal(romaji.defaultShowRomaji(undefined), true)
  assert.equal(romaji.defaultShowRomaji(null), true)
  assert.equal(romaji.defaultShowRomaji("always"), true)
  assert.equal(romaji.defaultShowRomaji("practice"), true)
  assert.equal(romaji.defaultShowRomaji("hidden"), false)
})

test("romaji visibility toggle respects the current override and profile", () => {
  assert.equal(romaji.nextRomajiVisibility(null, "always"), false)
  assert.equal(romaji.nextRomajiVisibility(null, "hidden"), true)
  assert.equal(romaji.nextRomajiVisibility(false, "always"), true)
  assert.equal(romaji.nextRomajiVisibility(true, "hidden"), false)
})

test("study surfaces hide romaji in practice mode while lessons still show it", () => {
  assert.equal(romaji.defaultShowStudyRomaji(undefined), true)
  assert.equal(romaji.defaultShowStudyRomaji("always"), true)
  assert.equal(romaji.defaultShowStudyRomaji("practice"), false)
  assert.equal(romaji.defaultShowStudyRomaji("hidden"), false)
  assert.equal(romaji.nextRomajiVisibility(null, "practice", romaji.defaultShowStudyRomaji), true)
  assert.equal(romaji.nextRomajiVisibility(null, "always", romaji.defaultShowStudyRomaji), false)
})
