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
