import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const loader = await loadTsModule("src/data/vocabulary/loader.ts")

test("vocabulary loader returns the requested level only", async () => {
  const survival = await loader.loadVocabularyLevel("survival")
  const daily = await loader.loadVocabularyLevel("daily")
  const fluent = await loader.loadVocabularyLevel("fluent")

  assert.ok(survival.length > 0)
  assert.ok(daily.length > 0)
  assert.ok(fluent.length > 0)
  assert.equal(survival.every((item) => item.level === "survival"), true)
  assert.equal(daily.every((item) => item.level === "daily"), true)
  assert.equal(fluent.every((item) => item.level === "fluent"), true)
})

test("vocabulary scope all combines every level", async () => {
  const survival = await loader.loadVocabularyLevel("survival")
  const daily = await loader.loadVocabularyLevel("daily")
  const fluent = await loader.loadVocabularyLevel("fluent")
  const all = await loader.loadVocabularyScope("all")

  assert.equal(all.length, survival.length + daily.length + fluent.length)
  assert.deepEqual(new Set(all.map((item) => item.level)), new Set(["survival", "daily", "fluent"]))
})

test("vocabulary loader returns only requested ids while preserving order", async () => {
  const survival = await loader.loadVocabularyForIds(["sur-g-1", "sur-v-1"])
  const mixed = await loader.loadVocabularyForIds(["sur-g-1", "flu-abs-1", "missing"])

  assert.deepEqual(survival.map((item) => item.id), ["sur-g-1", "sur-v-1"])
  assert.deepEqual(mixed.map((item) => item.id), ["sur-g-1", "flu-abs-1"])
  assert.deepEqual(new Set(survival.map((item) => item.level)), new Set(["survival"]))
  assert.deepEqual(new Set(mixed.map((item) => item.level)), new Set(["survival", "fluent"]))
})

test("vocabulary review pool adds same-level distractors without losing target ids", async () => {
  const pool = await loader.loadVocabularyReviewPool(["sur-g-1"])

  assert.equal(pool.length, 4)
  assert.equal(pool[0].id, "sur-g-1")
  assert.equal(pool.every((item) => item.level === "survival"), true)
  assert.equal(new Set(pool.map((item) => item.id)).size, pool.length)
})
