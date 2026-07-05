import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const options = await loadTsModule("src/lib/question-options.ts")

test("pickUniqueQuestionOptions returns a shuffled target plus unique distractors", () => {
  const result = options.pickUniqueQuestionOptions({
    target: { id: "a" },
    pool: [{ id: "a" }, { id: "b" }, { id: "b" }, { id: "c" }, { id: "d" }],
    getValue: (item) => item.id,
    random: () => 0,
  })

  assert.equal(result.length, 4)
  assert.deepEqual(new Set(result.map((item) => item.id)), new Set(["a", "b", "c", "d"]))
})

test("question option shuffling tolerates invalid random values", () => {
  const source = ["a", "b", "c", "d"]

  assert.equal(options.safeRandomIndex(() => 0, 4), 0)
  assert.equal(options.safeRandomIndex(() => 1, 4), 3)
  assert.equal(options.safeRandomIndex(() => Number.NaN, 4), 0)
  assert.equal(options.safeRandomIndex(() => 0, Number.NaN), -1)
  assert.equal(options.pickRandomListItem(source, () => Number.POSITIVE_INFINITY), "a")
  assert.equal(options.pickRandomListItem([], () => 0), null)
  assert.deepEqual(new Set(options.shuffleList(source, () => Number.NaN)), new Set(source))
  assert.deepEqual(new Set(options.shuffleList(source, () => Number.POSITIVE_INFINITY)), new Set(source))
  assert.deepEqual(new Set(options.shuffleList(source, () => -1)), new Set(source))
  assert.deepEqual(options.shuffleList(source, () => 1).length, source.length)
})

test("pickUniqueQuestionOptions returns null when the option pool is too small", () => {
  const result = options.pickUniqueQuestionOptions({
    target: { id: "a" },
    pool: [{ id: "a" }, { id: "b" }, { id: "c" }],
    getValue: (item) => item.id,
    random: () => 0,
  })

  assert.equal(result, null)
})

test("pickUniqueQuestionOptions normalizes invalid option counts", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }]
  const defaulted = options.pickUniqueQuestionOptions({
    target: pool[0],
    pool,
    getValue: (item) => item.id,
    random: () => Number.NaN,
    optionCount: Number.NaN,
  })
  const minimum = options.pickUniqueQuestionOptions({
    target: pool[0],
    pool,
    getValue: (item) => item.id,
    random: () => 0,
    optionCount: 1,
  })

  assert.equal(defaulted.length, 4)
  assert.equal(minimum.length, 2)
  assert.deepEqual(new Set(defaulted.map((item) => item.id)), new Set(["a", "b", "c", "d"]))
})
