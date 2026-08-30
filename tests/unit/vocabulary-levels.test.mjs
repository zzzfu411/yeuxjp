import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const levels = await loadTsModule("src/data/vocabulary/levels.ts")

test("vocabulary level registry exposes stable ids, default, metadata, and counts", () => {
  assert.deepEqual(Array.from(levels.VOCABULARY_LEVEL_IDS), ["survival", "daily", "fluent"])
  assert.equal(levels.DEFAULT_VOCABULARY_LEVEL, "survival")
  assert.deepEqual(levels.VOCABULARY_LEVEL_METADATA.map((level) => level.id), Array.from(levels.VOCABULARY_LEVEL_IDS))
  assert.deepEqual(Object.keys(levels.vocabLevelCounts), Array.from(levels.VOCABULARY_LEVEL_IDS))
  assert.equal(levels.vocabLevelCounts.survival, 544)
  assert.equal(levels.vocabLevelCounts.daily, 297)
  assert.equal(levels.vocabLevelCounts.fluent, 225)
})

test("vocabulary level registry validates URL level values", () => {
  assert.equal(levels.isVocabLevel("survival"), true)
  assert.equal(levels.isVocabLevel("daily"), true)
  assert.equal(levels.isVocabLevel("fluent"), true)
  assert.equal(levels.isVocabLevel("all"), false)
  assert.equal(levels.isVocabLevel(null), false)
})

test("vocabulary level registry maps over levels in canonical order", () => {
  assert.deepEqual(levels.mapVocabularyLevels((level) => `level:${level}`), {
    survival: "level:survival",
    daily: "level:daily",
    fluent: "level:fluent",
  })
})
