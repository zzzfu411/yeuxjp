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

test("pickUniqueQuestionOptions returns null when the option pool is too small", () => {
  const result = options.pickUniqueQuestionOptions({
    target: { id: "a" },
    pool: [{ id: "a" }, { id: "b" }, { id: "c" }],
    getValue: (item) => item.id,
    random: () => 0,
  })

  assert.equal(result, null)
})
