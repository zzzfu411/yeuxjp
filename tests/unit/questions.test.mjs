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
  assert.equal(questions.isQuestionAnswerCorrect(question, "今日は！"), true)
  assert.equal(questions.isQuestionAnswerCorrect({ correctAnswer: "Ａ" }, "a"), true)
  assert.equal(questions.isQuestionAnswerCorrect({ correctAnswer: "これをください" }, "これ を ください？"), true)
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

test("question results replace non-finite answer timestamps", () => {
  const originalDateNow = Date.now
  Date.now = () => 222
  try {
    const result = questions.makeQuestionResult(
      {
        type: "quiz:kana",
        correctAnswer: "a",
        options: [{ value: "a", display: "a" }],
      },
      "a",
      Number.NaN
    )

    assert.equal(result.correct, true)
    assert.equal(result.answeredAt, 222)
  } finally {
    Date.now = originalDateNow
  }
})

test("mistake notebook options are de-duplicated with answer normalization", () => {
  const result = questions.makeQuestionResult(
    {
      type: "lesson:typing",
      correctAnswer: "a",
      correctDisplay: "あ",
      options: [
        { value: "Ａ", display: "Ａ" },
        { value: "a", display: "a" },
      ],
    },
    "ka",
    1_700_000_000_000
  )
  const input = questions.questionToMistakeInput(result)

  assert.deepEqual(input.options, [
    { value: "Ａ", display: "Ａ" },
    { value: "ka", display: "ka" },
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

test("wrong question results preserve accepted answers for mistake review", () => {
  const result = questions.makeQuestionResult(
    {
      type: "lesson:typing",
      correctAnswer: "hello",
      acceptedAnswers: ["hi", "hey"],
      options: [{ value: "hello", display: "hello" }],
    },
    "wrong",
    1_700_000_000_002
  )
  const input = questions.questionToMistakeInput(result)

  assert.equal(result.correct, false)
  assert.deepEqual(input.acceptedAnswers, ["hi", "hey"])
})
