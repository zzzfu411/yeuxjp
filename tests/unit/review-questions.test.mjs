import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const review = await loadTsModule("src/lib/review-questions.ts")
const questions = await loadTsModule("src/lib/questions.ts")

test("today review queue prioritizes mistakes before due-sorted mixed decks", () => {
  const queue = review.buildTodayReviewQueue({
    dueMistakeIds: ["m2", "m1"],
    kanaDueIds: ["ka", "a", "sokuon:きって"],
    kanaSrsMap: {
      ka: { dueAt: 30, box: 1, createdAt: 1, right: 0, wrong: 0 },
      a: { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
      "sokuon:きって": { dueAt: 1, box: 1, createdAt: 1, right: 0, wrong: 0 },
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
    { deck: "kana", id: "a" },
    { deck: "vocab", id: "vo-early" },
    { deck: "kana", id: "ka" },
    { deck: "vocab", id: "vo-late" },
  ])
})

test("today review queue uses the shorter due deck first when due times match", () => {
  const queue = review.buildTodayReviewQueue({
    dueMistakeIds: [],
    kanaDueIds: ["ka", "a"],
    kanaSrsMap: {
      ka: { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
      a: { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
    },
    vocabDueIds: ["v1"],
    vocabSrsMap: {
      v1: { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
    },
  })

  assert.deepEqual(queue, [
    { deck: "vocab", id: "v1" },
    { deck: "kana", id: "ka" },
    { deck: "kana", id: "a" },
  ])
})

test("only canonical kana romaji ids are reviewable", () => {
  assert.equal(review.isReviewableKanaId("a"), true)
  assert.equal(review.isReviewableKanaId("kya"), true)
  assert.equal(review.isReviewableKanaId("sokuon:きって"), false)
  assert.equal(review.isReviewableKanaId("longvowel:おばあさん"), false)
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

  assert.equal(question.itemId, undefined)
  assert.equal(question.itemType, undefined)
  assert.equal(question.mode, undefined)
  assert.equal(question.mistakeId, "m1")
  assert.equal(question.correctAnswer, "は")
  assert.deepEqual(question.options, [
    { value: "は", display: "は" },
    { value: "が", display: "が" },
  ])
})

test("mistakeToQuestion de-duplicates legacy mistake options by normalized answers", () => {
  const question = review.mistakeToQuestion({
    id: "m-normalized",
    type: "lesson:typing",
    questionText: "あ",
    correctAnswer: "a",
    correctDisplay: "あ",
    options: [
      { value: "Ａ", display: "Ａ" },
      { value: "a", display: "a" },
      { value: "ka", display: "ka" },
    ],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  })

  assert.deepEqual(question.options, [
    { value: "Ａ", display: "Ａ" },
    { value: "ka", display: "ka" },
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
  assert.equal(vocabQuestion.options.length, 4)
})

test("vocabulary review question generator accepts a pre-resolved vocabulary item", () => {
  const vocabPool = [
    { id: "v1", kana: "mizu", romaji: "mizu", meaning: "water", category: "food", level: "survival" },
    { id: "v2", kana: "cha", romaji: "cha", meaning: "tea", category: "food", level: "survival" },
    { id: "v3", kana: "gohan", romaji: "gohan", meaning: "rice", category: "food", level: "survival" },
    { id: "v4", kana: "pan", romaji: "pan", meaning: "bread", category: "food", level: "survival" },
  ]

  const question = review.makeVocabReviewQuestion(vocabPool[0], vocabPool, () => 0)

  assert.equal(question.itemId, "v1")
  assert.equal(question.correctAnswer, "v1")
  assert.equal(question.correctDisplay, "water")
  assert.equal(question.options.length, 4)
})

test("vocabulary review questions require enough distractor options", () => {
  const question = review.makeVocabReviewQuestion(
    "v1",
    [
      { id: "v1", kana: "みず", romaji: "mizu", meaning: "water", category: "food", level: "survival" },
      { id: "v2", kana: "ちゃ", romaji: "cha", meaning: "tea", category: "food", level: "survival" },
      { id: "v3", kana: "ごはん", romaji: "gohan", meaning: "rice", category: "food", level: "survival" },
    ],
    () => 0
  )

  assert.equal(question, null)
})

test("mistake review questions accept stored alternate answers", () => {
  const question = review.mistakeToQuestion({
    id: "m-accepted",
    type: "lesson:typing",
    questionText: "prompt",
    correctAnswer: "hello",
    acceptedAnswers: ["hi"],
    options: [{ value: "hello", display: "hello" }],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  })

  assert.deepEqual(question.acceptedAnswers, ["hi"])
  assert.equal(questions.makeQuestionResult(question, "hi", 1).correct, true)
})
