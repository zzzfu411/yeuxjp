import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/learning-status-model.ts")

function item(overrides) {
  return {
    itemId: "item",
    itemType: "kana",
    recognition: 0,
    listening: 0,
    meaning: 0,
    recall: 0,
    production: 0,
    attempts: 0,
    correct: 0,
    updatedAt: 1,
    ...overrides,
  }
}

test("learning status combines legacy marks with practiced kana and vocabulary progress", () => {
  const status = model.buildLearningStatusModel({
    masteredKanaIds: ["a"],
    learnedVocabIds: ["sur-g-1"],
    items: {
      ka: item({
        itemId: "ka",
        itemType: "kana",
        recognition: 54,
        attempts: 3,
      }),
      "sur-v-1": item({
        itemId: "sur-v-1",
        itemType: "vocab",
        meaning: 54,
        attempts: 3,
      }),
      grammar: item({
        itemId: "grammar",
        itemType: "grammar",
        recognition: 100,
        attempts: 1,
      }),
    },
  })

  assert.deepEqual([...status.masteredKanaIds].sort(), ["a", "ka"])
  assert.deepEqual([...status.learnedVocabIds].sort(), ["sur-g-1", "sur-v-1"])
})

test("learning status ignores unpracticed or below-threshold item progress", () => {
  assert.equal(model.isItemLearnedFromProgress(item({ attempts: 0, recognition: 100 })), false)
  assert.equal(model.isItemLearnedFromProgress(item({ itemType: "kana", attempts: 1, recognition: 39 })), false)
  assert.equal(model.isItemLearnedFromProgress(item({ itemType: "vocab", attempts: 1, meaning: 39 })), false)
  assert.equal(model.isItemLearnedFromProgress(item({ itemType: "grammar", attempts: 1, recognition: 39, listening: 39, meaning: 39, recall: 39, production: 39 })), false)
  assert.equal(model.isItemLearnedFromProgress(item({ itemType: "grammar", attempts: 1, recognition: 40, listening: 40, meaning: 40, recall: 40, production: 40 })), true)
})

test("learning status uses item-type relevant mastery modes", () => {
  assert.equal(
    model.isItemLearnedFromProgress(item({ itemType: "vocab", attempts: 3, meaning: 54 })),
    true,
    "vocabulary meaning practice should count as learned without averaging unrelated modes"
  )
  assert.equal(
    model.isItemLearnedFromProgress(item({ itemType: "vocab", attempts: 3, recall: 54 })),
    true,
    "vocabulary recall practice should count as learned without averaging unrelated modes"
  )
  assert.equal(
    model.isItemLearnedFromProgress(item({ itemType: "kana", attempts: 3, recognition: 54 })),
    true,
    "kana recognition practice should count as mastered without averaging unrelated modes"
  )
  assert.equal(
    model.isItemLearnedFromProgress(item({ itemType: "kana", attempts: 3, listening: 54 })),
    true,
    "kana listening practice should count as mastered without averaging unrelated modes"
  )
  assert.equal(model.learningStatusMasteryScore(item({ itemType: "kana", recognition: Number.NaN, listening: 50 })), 50)
})

test("learning status ignores stale vocabulary ids from legacy marks and practiced progress", () => {
  const status = model.buildLearningStatusModel({
    masteredKanaIds: [],
    learnedVocabIds: ["sur-g-1", "sur-g-999"],
    items: {
      "sur-v-1": item({
        itemId: "sur-v-1",
        itemType: "vocab",
        meaning: 54,
        attempts: 3,
      }),
      "flu-tech-999": item({
        itemId: "flu-tech-999",
        itemType: "vocab",
        recognition: 100,
        meaning: 100,
        recall: 100,
        production: 100,
        attempts: 4,
      }),
    },
  })

  assert.deepEqual([...status.learnedVocabIds].sort(), ["sur-g-1", "sur-v-1"])
})

test("learning status ignores non-reviewable kana ids from legacy marks and practiced progress", () => {
  const status = model.buildLearningStatusModel({
    masteredKanaIds: ["a", "sokuon:kitte"],
    learnedVocabIds: [],
    items: {
      ka: item({
        itemId: "ka",
        itemType: "kana",
        recognition: 54,
        attempts: 3,
      }),
      "longvowel:obaasan": item({
        itemId: "longvowel:obaasan",
        itemType: "kana",
        recognition: 100,
        listening: 100,
        recall: 100,
        production: 100,
        attempts: 4,
      }),
    },
  })

  assert.deepEqual([...status.masteredKanaIds].sort(), ["a", "ka"])
})
