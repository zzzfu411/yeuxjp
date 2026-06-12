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

  assert.deepEqual([...visible].sort(), ["a", "ka"])
})

test("review visibility filters kana ids and SRS maps through canonical kana ids", () => {
  const visible = new Set(["a", "ka", "sokuon:kitte"])
  assert.equal(visibility.isReviewableKanaId("a"), true)
  assert.equal(visibility.isReviewableKanaId("sokuon:kitte"), false)
  assert.deepEqual(visibility.filterReviewableKanaIds(["sokuon:kitte", "ka", "ta", "a"], visible), ["ka", "a"])
  assert.deepEqual(Object.keys(visibility.filterReviewableKanaSrsMap({
    a: { dueAt: 1, box: 1, createdAt: 1, right: 0, wrong: 0 },
    ta: { dueAt: 1, box: 1, createdAt: 1, right: 0, wrong: 0 },
    "sokuon:kitte": { dueAt: 1, box: 1, createdAt: 1, right: 0, wrong: 0 },
  }, visible)).sort(), ["a"])
})
