import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const options = await loadTsModule("src/lib/quiz-mode-options.ts")
const types = await loadTsModule("src/lib/quiz-types.ts")

test("quiz mode options cover every public quiz mode exactly once", () => {
  const modes = options.QUIZ_MODE_OPTIONS.map((option) => option.mode)
  const expected = [...types.QUIZ_MODE_SET]

  assert.deepEqual([...new Set(modes)], modes)
  assert.deepEqual([...modes].sort(), expected.sort())
})

test("quiz mode options expose stable browser test ids", () => {
  for (const option of options.QUIZ_MODE_OPTIONS) {
    assert.equal(option.testId, `quiz-mode-${option.mode}`)
    assert.match(option.title, /\S/)
    assert.match(option.description, /\S/)
  }
})
