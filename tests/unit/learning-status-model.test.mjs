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
        recognition: 80,
        listening: 40,
        recall: 40,
        production: 40,
        attempts: 4,
      }),
      "sur-v-1": item({
        itemId: "sur-v-1",
        itemType: "vocab",
        recognition: 40,
        meaning: 80,
        recall: 40,
        production: 40,
        attempts: 4,
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
  assert.equal(model.isItemLearnedFromProgress(item({ attempts: 1, recognition: 30, listening: 30, meaning: 30, recall: 30, production: 30 })), false)
  assert.equal(model.isItemLearnedFromProgress(item({ attempts: 1, recognition: 40, listening: 40, meaning: 40, recall: 40, production: 40 })), true)
})

test("learning status ignores stale vocabulary ids from legacy marks and practiced progress", () => {
  const status = model.buildLearningStatusModel({
    masteredKanaIds: [],
    learnedVocabIds: ["sur-g-1", "sur-g-999"],
    items: {
      "sur-v-1": item({
        itemId: "sur-v-1",
        itemType: "vocab",
        recognition: 40,
        meaning: 80,
        recall: 40,
        production: 40,
        attempts: 4,
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
