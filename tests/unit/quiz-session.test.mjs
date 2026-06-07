import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const session = await loadTsModule("src/lib/quiz-session.ts")

test("quiz stats start empty and track correct answer totals", () => {
  let stats = session.createQuizStats()
  assert.deepEqual(stats, { score: 0, total: 0 })
  assert.equal(session.getQuizAccuracy(stats), null)

  stats = session.recordQuizAnswer(stats, true)
  stats = session.recordQuizAnswer(stats, false)
  stats = session.recordQuizAnswer(stats, true)

  assert.deepEqual(stats, { score: 2, total: 3 })
  assert.equal(session.getQuizAccuracy(stats), 67)
})
