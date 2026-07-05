import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const quiz = await loadTsModule("src/lib/quiz-generators.ts")
const review = await loadTsModule("src/lib/review-questions.ts")

const vocab = [
  { id: "v1", kana: "mizu", romaji: "mizu", meaning: "water", category: "food", level: "survival" },
  { id: "v2", kana: "cha", romaji: "cha", meaning: "tea", category: "food", level: "survival" },
  { id: "v3", kana: "gohan", romaji: "gohan", meaning: "rice", category: "food", level: "survival" },
  { id: "v4", kana: "pan", romaji: "pan", meaning: "bread", category: "food", level: "survival" },
]

const validItemTypes = new Set(["kana", "vocab", "grammar"])
const validPracticeModes = new Set(["recognition", "production", "listening", "meaning"])

function assertProgressMetadata(question, label) {
  assert.equal(typeof question.itemId, "string", `${label} should expose an itemId`)
  assert.ok(question.itemId.length > 0, `${label} should expose a non-empty itemId`)
  assert.ok(validItemTypes.has(question.itemType), `${label} should expose a valid itemType`)
  assert.ok(validPracticeModes.has(question.mode), `${label} should expose a valid practice mode`)
}

test("all public quiz modes expose progress metadata for learning-session writes", () => {
  const cases = [
    { mode: "hiragana-romaji", itemType: "kana", practiceMode: "recognition" },
    { mode: "audio-kana", itemType: "kana", practiceMode: "listening" },
    { mode: "audio-sokuon", itemType: "kana", practiceMode: "listening" },
    { mode: "audio-longvowel", itemType: "kana", practiceMode: "listening" },
    { mode: "verb-conjugation", itemType: "grammar", practiceMode: "production" },
    { mode: "particle", itemType: "grammar", practiceMode: "recognition" },
    { mode: "meaning-vocab", itemType: "vocab", practiceMode: "meaning" },
  ]

  for (const entry of cases) {
    const base = quiz.getKanaPool("seion")
    const question = quiz.generateQuizQuestion({
      mode: entry.mode,
      kanaBasePool: base,
      kanaTargetPool: base,
      vocabBasePool: vocab,
      vocabTargetPool: vocab,
      random: () => 0,
    })

    assert.ok(question, `${entry.mode} should generate a question`)
    assertProgressMetadata(question, entry.mode)
    assert.equal(question.itemType, entry.itemType)
    assert.equal(question.mode, entry.practiceMode)
  }
})

test("review question builders expose progress metadata and mistake replay restores stored metadata", () => {
  const kanaQuestion = review.makeKanaReviewQuestion("a", () => 0)
  const vocabQuestion = review.makeVocabReviewQuestion("v1", vocab, () => 0)
  const mistakeQuestion = review.mistakeToQuestion({
    id: "m1",
    type: "legacy-mistake",
    questionText: "prompt",
    itemId: "a",
    itemType: "kana",
    mode: "recognition",
    correctAnswer: "right",
    options: [{ value: "right", display: "right" }],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  })

  assertProgressMetadata(kanaQuestion, "kana review")
  assert.equal(kanaQuestion.itemId, "a")
  assert.equal(kanaQuestion.itemType, "kana")
  assert.equal(kanaQuestion.mode, "recognition")

  assertProgressMetadata(vocabQuestion, "vocabulary review")
  assert.equal(vocabQuestion.itemId, "v1")
  assert.equal(vocabQuestion.itemType, "vocab")
  assert.equal(vocabQuestion.mode, "meaning")

  assertProgressMetadata(mistakeQuestion, "mistake review")
  assert.equal(mistakeQuestion.itemId, "a")
  assert.equal(mistakeQuestion.itemType, "kana")
  assert.equal(mistakeQuestion.mode, "recognition")
  assert.equal(mistakeQuestion.mistakeId, "m1")

  const legacyMistakeQuestion = review.mistakeToQuestion({
    id: "legacy",
    type: "legacy-mistake",
    questionText: "prompt",
    correctAnswer: "right",
    options: [{ value: "right", display: "right" }],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  })

  assert.equal(legacyMistakeQuestion.itemId, undefined)
  assert.equal(legacyMistakeQuestion.itemType, undefined)
  assert.equal(legacyMistakeQuestion.mode, undefined)
})
