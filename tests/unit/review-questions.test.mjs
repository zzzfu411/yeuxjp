import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const review = await loadTsModule("src/lib/review-questions.ts")

test("today review queue prioritizes mistakes before due-sorted kana and vocab", () => {
  const queue = review.buildTodayReviewQueue({
    dueMistakeIds: ["m2", "m1"],
    kanaDueIds: ["ka-late", "ka-early"],
    kanaSrsMap: {
      "ka-late": { dueAt: 30, box: 1, createdAt: 1, right: 0, wrong: 0 },
      "ka-early": { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
    },
    vocabDueIds: ["vo-late", "vo-early"],
    vocabSrsMap: {
      "vo-late": { dueAt: 40, box: 1, createdAt: 1, right: 0, wrong: 0 },
      "vo-early": { dueAt: 20, box: 1, createdAt: 1, right: 0, wrong: 0 },
    },
  })

  assert.deepEqual(queue, [
    { deck: "mistakes", id: "m2" },
    { deck: "mistakes", id: "m1" },
    { deck: "kana", id: "ka-early" },
    { deck: "kana", id: "ka-late" },
    { deck: "vocab", id: "vo-early" },
    { deck: "vocab", id: "vo-late" },
  ])
})

test("mistakeToQuestion preserves answers and de-duplicates options", () => {
  const question = review.mistakeToQuestion({
    id: "m1",
    type: "particle",
    questionText: "わたし＿学生です",
    correctAnswer: "は",
    correctDisplay: "は",
    options: [
      { value: "が", display: "が" },
      { value: "が", display: "が" },
    ],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  })

  assert.equal(question.itemId, "m1")
  assert.equal(question.correctAnswer, "は")
  assert.deepEqual(question.options, [
    { value: "は", display: "は" },
    { value: "が", display: "が" },
  ])
})

test("review question generators produce shared Question objects", () => {
  const kanaQuestion = review.makeKanaReviewQuestion("a", () => 0)
  const vocabQuestion = review.makeVocabReviewQuestion(
    "v1",
    [
      { id: "v1", kana: "みず", romaji: "mizu", meaning: "水", category: "food", level: "survival" },
      { id: "v2", kana: "ちゃ", romaji: "cha", meaning: "茶", category: "food", level: "survival" },
      { id: "v3", kana: "ごはん", romaji: "gohan", meaning: "饭", category: "food", level: "survival" },
      { id: "v4", kana: "パン", romaji: "pan", meaning: "面包", category: "food", level: "survival" },
    ],
    () => 0
  )

  assert.equal(kanaQuestion.itemType, "kana")
  assert.equal(kanaQuestion.correctAnswer, "a")
  assert.equal(vocabQuestion.itemType, "vocab")
  assert.equal(vocabQuestion.correctAnswer, "v1")
})
