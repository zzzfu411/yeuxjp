import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const visibility = await loadTsModule("src/lib/review-visibility.ts")

test("review visible ids include explicit marks and practiced progress items", () => {
  const visible = visibility.buildReviewVisibleIdSet({
    explicitIds: ["a", "sokuon:kitte"],
    itemType: "kana",
    items: {
      ka: {
        itemId: "ka",
        itemType: "kana",
        recognition: 18,
        listening: 0,
        meaning: 0,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: 1,
      },
      practicedSokuon: {
        itemId: "sokuon:kitte",
        itemType: "kana",
        recognition: 18,
        listening: 0,
        meaning: 0,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: 1,
      },
      ignoredVocab: {
        itemId: "v1",
        itemType: "vocab",
        recognition: 0,
        listening: 0,
        meaning: 18,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: 1,
      },
      unattempted: {
        itemId: "sa",
        itemType: "kana",
        recognition: 100,
        listening: 100,
        meaning: 100,
        recall: 100,
        production: 100,
        attempts: 0,
        correct: 0,
        updatedAt: 1,
      },
    },
  })

  assert.deepEqual([...visible].sort(), ["hiragana:a", "hiragana:ka", "katakana:a", "katakana:ka"])
})

test("review visible vocabulary ids include only ids that still exist in vocabulary data", () => {
  const visible = visibility.buildReviewVisibleIdSet({
    explicitIds: ["sur-g-1", "sur-g-999"],
    itemType: "vocab",
    items: {
      practicedKnown: {
        itemId: "day-v-1",
        itemType: "vocab",
        recognition: 0,
        listening: 0,
        meaning: 18,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: 1,
      },
      practicedStale: {
        itemId: "flu-tech-999",
        itemType: "vocab",
        recognition: 0,
        listening: 0,
        meaning: 18,
        recall: 0,
        production: 0,
        attempts: 1,
        correct: 1,
        updatedAt: 1,
      },
    },
  })

  assert.deepEqual([...visible].sort(), ["day-v-1", "sur-g-1"])
})

test("review visibility filters kana ids and SRS maps through canonical kana ids", () => {
  const visible = new Set(["hiragana:a", "katakana:ka", "sokuon:kitte"])
  assert.equal(visibility.isReviewableKanaId("hiragana:a"), true)
  assert.equal(visibility.isReviewableKanaId("a"), false)
  assert.equal(visibility.isReviewableKanaId("sokuon:kitte"), false)
  assert.deepEqual(visibility.filterReviewableKanaIds(["sokuon:kitte", "katakana:ka", "hiragana:ta", "hiragana:a"], visible), ["katakana:ka", "hiragana:a"])
  assert.deepEqual(Object.keys(visibility.filterReviewableKanaSrsMap({
    a: { dueAt: 1, box: 1, createdAt: 1, right: 0, wrong: 0 },
    ta: { dueAt: 1, box: 1, createdAt: 1, right: 0, wrong: 0 },
    "sokuon:kitte": { dueAt: 1, box: 1, createdAt: 1, right: 0, wrong: 0 },
  }, visible)).sort(), ["hiragana:a"])
})
