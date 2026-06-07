import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const feedback = await loadTsModule("src/lib/answer-option-feedback.ts")

test("answer option feedback is idle before an answer is selected", () => {
  assert.equal(
    feedback.getAnswerOptionFeedback({
      selectedAnswer: null,
      optionValue: "a",
      isCorrectOption: true,
    }),
    "idle"
  )
})

test("answer option feedback marks the correct option after selection", () => {
  assert.equal(
    feedback.getAnswerOptionFeedback({
      selectedAnswer: "b",
      optionValue: "a",
      isCorrectOption: true,
    }),
    "correct"
  )
})

test("answer option feedback marks the selected wrong option", () => {
  assert.equal(
    feedback.getAnswerOptionFeedback({
      selectedAnswer: "b",
      optionValue: "b",
      isCorrectOption: false,
    }),
    "wrong"
  )
})

test("answer option feedback dims unselected wrong options after selection", () => {
  assert.equal(
    feedback.getAnswerOptionFeedback({
      selectedAnswer: "b",
      optionValue: "c",
      isCorrectOption: false,
    }),
    "dimmed"
  )
})

test("answer option class names and icons are derived from feedback state", () => {
  assert.equal(feedback.getAnswerOptionClassName("idle"), "")
  assert.match(feedback.getAnswerOptionClassName("correct"), /bg-green-100/)
  assert.match(feedback.getAnswerOptionClassName("wrong"), /bg-red-100/)
  assert.equal(feedback.getAnswerOptionClassName("dimmed"), "opacity-50")

  assert.equal(feedback.shouldShowCorrectAnswerIcon("correct"), true)
  assert.equal(feedback.shouldShowCorrectAnswerIcon("wrong"), false)
  assert.equal(feedback.shouldShowWrongAnswerIcon("wrong"), true)
  assert.equal(feedback.shouldShowWrongAnswerIcon("correct"), false)
})
