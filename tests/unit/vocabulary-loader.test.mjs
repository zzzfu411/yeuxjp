import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const loader = await loadTsModule("src/data/vocabulary/loader.ts")
const levels = await loadTsModule("src/data/vocabulary/levels.ts")
const reviewQuestions = await loadTsModule("src/lib/review-questions.ts")

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

test("vocabulary loader reuses in-flight level loads", async () => {
  const first = loader.loadVocabularyLevel("daily")
  const second = loader.loadVocabularyLevel("daily")

  assert.strictEqual(first, second)
  assert.strictEqual(await first, await second)
})

test("vocabulary loader evicts failed level loads before retry", () => {
  const source = fs.readFileSync(path.join(root, "src/data/vocabulary/loader.ts"), "utf8")

  assert.match(source, /Array\.isArray\(items\)/)
  assert.match(source, /items\.slice\(\)/)
  assert.match(source, /\.catch\(\(error\) => \{/)
  assert.match(source, /vocabularyLevelPromises\.delete\(level\)/)
  assert.match(source, /throw error/)
})

test("vocabulary scope all combines every level", async () => {
  const levelData = await Promise.all(levels.VOCABULARY_LEVEL_IDS.map(loader.loadVocabularyLevel))
  const all = await loader.loadVocabularyScope("all")

  assert.equal(all.length, levelData.flat().length)
  assert.deepEqual(new Set(all.map((item) => item.level)), new Set(levels.VOCABULARY_LEVEL_IDS))
})

test("vocabulary scope all follows the shared level registry", () => {
  const source = fs.readFileSync(path.join(root, "src/data/vocabulary/loader.ts"), "utf8")

  assert.match(source, /VOCABULARY_LEVEL_IDS\.map\(loadVocabularyLevel\)/)
  assert.doesNotMatch(source, /loadVocabularyLevel\("survival"\)[\s\S]*loadVocabularyLevel\("daily"\)[\s\S]*loadVocabularyLevel\("fluent"\)/)
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

test("vocabulary review pool expands past duplicate visible answers", async () => {
  const pool = await loader.loadVocabularyReviewPool(["day-v-62"])

  assert.equal(pool[0].id, "day-v-62")
  assert.ok(pool.length > 4, "duplicate meanings should trigger another same-level distractor")
  assert.ok(
    reviewQuestions.makeVocabReviewQuestion(pool[0], pool, () => 0, "meaning"),
    "meaning review should have enough unique visible options"
  )
  assert.ok(
    reviewQuestions.makeVocabReviewQuestion(pool[0], pool, () => 0, "listening"),
    "listening review should have enough unique visible options"
  )
})
