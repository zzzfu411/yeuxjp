import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const answers = await loadTsModule("src/lib/lesson-step-answers.ts")

test("stored lesson step answers win over older practice-log copies", () => {
  const merged = answers.mergeLessonStepAnswers(
    { "recognize-a": { correct: true, answer: "a", createdAt: 20 } },
    { "recognize-a": { correct: false, answer: "i", createdAt: 10 }, "listen-o": { correct: true, createdAt: 11 } }
  )

  assert.equal(merged["recognize-a"].correct, true)
  assert.equal(merged["recognize-a"].answer, "a")
  assert.equal(merged["listen-o"].correct, true)
})

test("applyLessonStepAnswer writes into an existing lesson without dropping other fields", () => {
  const next = answers.applyLessonStepAnswer(
    { "day-1": { lessonId: "day-1", status: "started", startedAt: 1 } },
    "day-1",
    "type-hello",
    { correct: false, answer: "こんにちは", createdAt: 8 },
    9
  )

  assert.equal(next["day-1"].status, "started")
  assert.equal(next["day-1"].stepAnswers["type-hello"].correct, false)
  assert.equal(next["day-1"].updatedAt, 9)
  assert.equal(answers.applyLessonStepAnswer({}, "day-1", "type-hello", { correct: true, createdAt: 1 }, 1), null)
})
