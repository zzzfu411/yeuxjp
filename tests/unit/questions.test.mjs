import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const questions = await loadTsModule("src/lib/questions.ts")

test("answer checking normalizes punctuation, whitespace, and accepted answers", () => {
  const question = {
    correctAnswer: "こんにちは",
    acceptedAnswers: ["今日は"],
  }

  assert.equal(questions.isQuestionAnswerCorrect(question, " こんにちは。"), true)
  assert.equal(questions.isQuestionAnswerCorrect(question, "今 日 は"), true)
  assert.equal(questions.isQuestionAnswerCorrect(question, "こんばんは"), false)
})

test("wrong question results become mistake notebook input with stable options", () => {
  const question = {
    type: "review:vocab",
    itemId: "vocab-1",
    itemType: "vocab",
    mode: "meaning",
    questionText: "みず",
    correctAnswer: "water",
    correctDisplay: "水",
    explanation: "基础名词。",
    options: [
      { value: "tea", display: "茶" },
      { value: "tea", display: "茶" },
    ],
  }

  const result = questions.makeQuestionResult(question, "tea", 1_700_000_000_000)
  const input = questions.questionToMistakeInput(result)

  assert.equal(result.correct, false)
  assert.equal(input.type, "review:vocab")
  assert.equal(input.correctAnswer, "water")
  assert.equal(input.wrongAnswer, "tea")
  assert.deepEqual(input.options, [
    { value: "water", display: "水" },
    { value: "tea", display: "茶" },
  ])
})

test("correct question results are not recorded as mistakes", () => {
  const result = questions.makeQuestionResult(
    {
      type: "review:kana",
      correctAnswer: "a",
      options: [{ value: "a", display: "a" }],
    },
    "a"
  )

  assert.equal(questions.questionToMistakeInput(result), null)
})

test("mistake review questions keep the existing mistake id when wrong again", () => {
  const question = {
    type: "review:mistake",
    mistakeId: "existing-mistake-id",
    correctAnswer: "right",
    options: [
      { value: "right", display: "right" },
      { value: "wrong", display: "wrong" },
    ],
  }

  const result = questions.makeQuestionResult(question, "wrong", 1_700_000_000_001)
  const input = questions.questionToMistakeInput(result)

  assert.equal(result.correct, false)
  assert.equal(input.id, "existing-mistake-id")
})
