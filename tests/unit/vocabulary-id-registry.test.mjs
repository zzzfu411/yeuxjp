import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const registry = await loadTsModule("src/data/vocabulary/id-registry.ts")

test("vocabulary id registry recognizes current vocabulary ids without importing entries", () => {
  assert.equal(registry.isKnownVocabularyId("sur-g-1"), true)
  assert.equal(registry.isKnownVocabularyId("sur-num-100"), true)
  assert.equal(registry.isKnownVocabularyId("sur-num-c10"), true)
  assert.equal(registry.isKnownVocabularyId("day-v-50"), true)
  assert.equal(registry.isKnownVocabularyId("flu-tech-15"), true)
  assert.equal(registry.getKnownVocabularyLevelForId("sur-g-1"), "survival")
  assert.equal(registry.getKnownVocabularyLevelForId("day-city-20"), "daily")
  assert.equal(registry.getKnownVocabularyLevelForId("flu-cul-20"), "fluent")
})

test("vocabulary id registry rejects stale or malformed vocabulary ids", () => {
  assert.equal(registry.isKnownVocabularyId("sur-g-31"), false)
  assert.equal(registry.isKnownVocabularyId("sur-num-11"), false)
  assert.equal(registry.isKnownVocabularyId("sur-num-9999"), false)
  assert.equal(registry.isKnownVocabularyId("day-v-51"), false)
  assert.equal(registry.isKnownVocabularyId("flu-tech-16"), false)
  assert.equal(registry.isKnownVocabularyId("unknown-1"), false)
  assert.equal(registry.isKnownVocabularyId("sur-g-01"), false)
})
