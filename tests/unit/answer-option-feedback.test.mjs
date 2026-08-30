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
  assert.match(feedback.getAnswerOptionClassName("correct"), /border-primary\/45 bg-primary\/10/)
  assert.match(feedback.getAnswerOptionClassName("wrong"), /border-destructive\/65 bg-destructive\/10/)
  assert.equal(feedback.getAnswerOptionClassName("dimmed"), "opacity-50")

  assert.equal(feedback.shouldShowCorrectAnswerIcon("correct"), true)
  assert.equal(feedback.shouldShowCorrectAnswerIcon("wrong"), false)
  assert.equal(feedback.shouldShowWrongAnswerIcon("wrong"), true)
  assert.equal(feedback.shouldShowWrongAnswerIcon("correct"), false)
})

test("answer option aria labels include feedback state", () => {
  assert.equal(feedback.getAnswerOptionAriaLabel("a", "idle"), "a")
  assert.equal(feedback.getAnswerOptionAriaLabel("a", "correct"), "a，正确答案")
  assert.equal(feedback.getAnswerOptionAriaLabel("b", "wrong"), "b，你的选择，回答错误")
  assert.equal(feedback.getAnswerOptionAriaLabel("c", "dimmed"), "c，未选择")
})
