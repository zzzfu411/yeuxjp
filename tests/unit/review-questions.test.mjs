import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const review = await loadTsModule("src/lib/review-questions.ts")
const questions = await loadTsModule("src/lib/questions.ts")

test("today review queue prioritizes mistakes before due-sorted mixed decks", () => {
  const queue = review.buildTodayReviewQueue({
    dueMistakeIds: ["m2", "m1"],
    kanaDueIds: ["katakana:ka", "hiragana:a", "sokuon:きって"],
    kanaSrsMap: {
      "katakana:ka": { dueAt: 30, box: 1, createdAt: 1, right: 0, wrong: 0 },
      "hiragana:a": { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
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
    { deck: "kana", id: "hiragana:a" },
    { deck: "vocab", id: "vo-early" },
    { deck: "kana", id: "katakana:ka" },
    { deck: "vocab", id: "vo-late" },
  ])
})

test("today review queue uses the shorter due deck first when due times match", () => {
  const queue = review.buildTodayReviewQueue({
    dueMistakeIds: [],
    kanaDueIds: ["katakana:ka", "hiragana:a"],
    kanaSrsMap: {
      "katakana:ka": { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
      "hiragana:a": { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
    },
    vocabDueIds: ["v1"],
    vocabSrsMap: {
      v1: { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
    },
  })

  assert.deepEqual(queue, [
    { deck: "vocab", id: "v1" },
    { deck: "kana", id: "katakana:ka" },
    { deck: "kana", id: "hiragana:a" },
  ])
})

test("both scripts of the same romaji enqueue as independent kana reviews", () => {
  const queue = review.buildTodayReviewQueue({
    dueMistakeIds: [],
    kanaDueIds: ["hiragana:a", "katakana:a"],
    kanaSrsMap: {
      "hiragana:a": { dueAt: 20, box: 1, createdAt: 1, right: 0, wrong: 0 },
      "katakana:a": { dueAt: 10, box: 1, createdAt: 1, right: 0, wrong: 0 },
    },
    vocabDueIds: [],
    vocabSrsMap: {},
  })

  assert.deepEqual(queue, [
    { deck: "kana", id: "katakana:a" },
    { deck: "kana", id: "hiragana:a" },
  ])
})

test("only canonical script-aware kana ids are reviewable", () => {
  assert.equal(review.isReviewableKanaId("hiragana:a"), true)
  assert.equal(review.isReviewableKanaId("katakana:kya"), true)
  assert.equal(review.isReviewableKanaId("a"), false)
  assert.equal(review.isReviewableKanaId("sokuon:きって"), false)
  assert.equal(review.isReviewableKanaId("longvowel:おばあさん"), false)
})

test("mistakeToQuestion preserves answers and de-duplicates options", () => {
  const question = review.mistakeToQuestion({
    id: "m1",
    type: "particle",
    itemId: "particle-wa",
    itemType: "grammar",
    mode: "recognition",
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

  assert.equal(question.itemId, "particle-wa")
  assert.equal(question.itemType, "grammar")
  assert.equal(question.mode, "recognition")
  assert.equal(question.mistakeId, "m1")
  assert.equal(question.correctAnswer, "は")
  assert.deepEqual(question.options, [
    { value: "は", display: "は" },
    { value: "が", display: "が" },
  ])
})

test("typed review is used when a production mistake has no distractors", () => {
  const base = {
    id: "type-1",
    type: "lesson:typing",
    itemId: "sur-g-1",
    itemType: "vocab",
    mode: "recall",
    questionText: "输入“你好”",
    correctAnswer: "こんにちは",
    options: [{ value: "こんにちは", display: "こんにちは" }],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  }
  const typed = review.mistakeToQuestion(base)
  const withWrong = review.mistakeToQuestion({
    ...base,
    id: "type-2",
    lastWrongAnswer: "こんばんは",
  })

  assert.equal(review.questionUsesTypedReview(typed), true)
  assert.equal(review.questionUsesTypedReview(withWrong), false)
  assert.ok(withWrong.options.some((option) => option.value === "こんばんは"))
  assert.equal(review.shouldShowReviewSpecialFeedback("particle"), true)
  assert.equal(review.shouldShowReviewSpecialFeedback("verb-conjugation"), true)
  assert.equal(review.shouldShowReviewSpecialFeedback("review:kana"), false)
})

test("mistakeToQuestion keeps legacy mistakes compatible without progress metadata", () => {
  const question = review.mistakeToQuestion({
    id: "legacy",
    type: "legacy-mistake",
    questionText: "prompt",
    correctAnswer: "right",
    options: [{ value: "right", display: "right" }],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 1,
  })

  assert.equal(question.itemId, undefined)
  assert.equal(question.itemType, undefined)
  assert.equal(question.mode, undefined)
  assert.equal(question.mistakeId, "legacy")
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
  const hiraganaQuestion = review.makeKanaReviewQuestion("hiragana:a", () => 0)
  const katakanaQuestion = review.makeKanaReviewQuestion("katakana:a", () => 0)
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

  assert.equal(hiraganaQuestion.itemType, "kana")
  assert.equal(hiraganaQuestion.itemId, "hiragana:a")
  assert.equal(hiraganaQuestion.questionText, "あ")
  assert.equal(hiraganaQuestion.questionAudio, "あ")
  assert.equal(hiraganaQuestion.correctAnswer, "a")
  assert.equal(katakanaQuestion.itemType, "kana")
  assert.equal(katakanaQuestion.itemId, "katakana:a")
  assert.equal(katakanaQuestion.questionText, "ア")
  assert.equal(katakanaQuestion.questionAudio, "ア")
  assert.equal(katakanaQuestion.correctAnswer, "a")
  assert.notEqual(hiraganaQuestion.questionText, katakanaQuestion.questionText)
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

function makeDueSrsEntry(dueAt) {
  return { dueAt, box: 1, createdAt: 1, right: 0, wrong: 0 }
}

test("today review queue is capped at the shared daily limit", () => {
  const vocabDueIds = Array.from({ length: 60 }, (_, index) => `sur-x-${index + 1}`)
  const vocabSrsMap = Object.fromEntries(vocabDueIds.map((id, index) => [id, makeDueSrsEntry(index + 1)]))

  const queue = review.buildTodayReviewQueue({
    dueMistakeIds: [],
    kanaDueIds: [],
    kanaSrsMap: {},
    vocabDueIds,
    vocabSrsMap,
  })

  assert.equal(review.TODAY_REVIEW_QUEUE_LIMIT, 30)
  assert.equal(queue.length, review.TODAY_REVIEW_QUEUE_LIMIT)
  assert.deepEqual(queue[0], { deck: "vocab", id: "sur-x-1" })
  assert.deepEqual(queue[queue.length - 1], { deck: "vocab", id: "sur-x-30" })
})

test("today review queue cap keeps mistakes first and accepts a custom limit", () => {
  const vocabDueIds = ["v-late", "v-early"]
  const queue = review.buildTodayReviewQueue({
    dueMistakeIds: ["m1", "m2"],
    kanaDueIds: [],
    kanaSrsMap: {},
    vocabDueIds,
    vocabSrsMap: {
      "v-late": makeDueSrsEntry(20),
      "v-early": makeDueSrsEntry(10),
    },
    limit: 3,
  })

  assert.deepEqual(queue, [
    { deck: "mistakes", id: "m1" },
    { deck: "mistakes", id: "m2" },
    { deck: "vocab", id: "v-early" },
  ])
})

test("today review queue falls back to the default limit for invalid limits", () => {
  const vocabDueIds = Array.from({ length: 40 }, (_, index) => `sur-y-${index + 1}`)
  const vocabSrsMap = Object.fromEntries(vocabDueIds.map((id, index) => [id, makeDueSrsEntry(index + 1)]))

  for (const limit of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
    const queue = review.buildTodayReviewQueue({
      dueMistakeIds: [],
      kanaDueIds: [],
      kanaSrsMap: {},
      vocabDueIds,
      vocabSrsMap,
      limit,
    })
    assert.equal(queue.length, review.TODAY_REVIEW_QUEUE_LIMIT)
  }
})

const directionVocabPool = [
  { id: "v1", kanji: "水", kana: "みず", romaji: "mizu", meaning: "水", category: "food", level: "survival" },
  { id: "v2", kana: "ちゃ", romaji: "cha", meaning: "茶", category: "food", level: "survival" },
  { id: "v3", kanji: "ご飯", kana: "ごはん", romaji: "gohan", meaning: "饭", category: "food", level: "survival" },
  { id: "v4", kana: "パン", romaji: "pan", meaning: "面包", category: "food", level: "survival" },
]

test("vocabulary recall review questions prompt with meaning and answer in Japanese", () => {
  const question = review.makeVocabReviewQuestion("v3", directionVocabPool, () => 0, "recall")

  assert.equal(question.mode, "recall")
  assert.equal(question.questionText, "饭")
  assert.equal(question.questionAudio, undefined)
  assert.equal(question.correctAnswer, "v3")
  assert.equal(question.correctDisplay, "ご飯（ごはん）")
  assert.ok(question.options.every((option) => /（|[ぁ-んァ-ン]/.test(option.display)))
})

test("vocabulary listening review questions auto play audio without revealing the word", () => {
  const question = review.makeVocabReviewQuestion("v1", directionVocabPool, () => 0, "listening")

  assert.equal(question.mode, "listening")
  assert.equal(question.questionAudio, "みず")
  assert.equal(question.autoPlayAudio, true)
  assert.ok(!question.questionText.includes("みず"))
  assert.ok(!question.questionText.includes("水"))
  assert.equal(question.correctAnswer, "v1")
  assert.ok(question.options.every((option) => option.display === directionVocabPool.find((v) => v.id === option.value)?.meaning))
})

test("vocabulary review options stay unique by the text learners can see", () => {
  const duplicatePool = [
    { id: "train-daily", kanji: "電車", kana: "でんしゃ", romaji: "densha", meaning: "电车", category: "daily", level: "survival" },
    { id: "train-transport", kanji: "電車", kana: "でんしゃ", romaji: "densha", meaning: "电车", category: "transport", level: "survival" },
    { id: "bus", kana: "バス", romaji: "basu", meaning: "巴士", category: "transport", level: "survival" },
    { id: "taxi", kana: "タクシー", romaji: "takushii", meaning: "出租车", category: "transport", level: "survival" },
    { id: "bike", kanji: "自転車", kana: "じてんしゃ", romaji: "jitensha", meaning: "自行车", category: "transport", level: "survival" },
  ]

  for (const direction of ["meaning", "recall", "listening"]) {
    const question = review.makeVocabReviewQuestion("train-daily", duplicatePool, () => 0, direction)
    assert.equal(question.options.length, 4)
    assert.equal(new Set(question.options.map((option) => option.display)).size, question.options.length)
    assert.equal(question.options.filter((option) => option.display.includes("电车") || option.display.includes("電車")).length, 1)
  }
})

test("vocabulary review prompt models hide answer-revealing audio and text per direction", () => {
  const item = directionVocabPool[0]

  const meaning = review.getVocabReviewPromptModel(item, "meaning")
  assert.equal(meaning.display, "水")
  assert.equal(meaning.sub, "みず")
  assert.equal(meaning.audio, "みず")
  assert.equal(meaning.autoPlayAudio, true)

  const meaningWithRomaji = review.getVocabReviewPromptModel(item, "meaning", true)
  assert.equal(meaningWithRomaji.sub, "みず · mizu")

  const recall = review.getVocabReviewPromptModel(item, "recall")
  assert.equal(recall.display, "水")
  assert.equal(recall.audio, undefined)
  assert.equal(recall.autoPlayAudio, false)

  const listening = review.getVocabReviewPromptModel(item, "listening")
  assert.ok(!listening.display.includes("水"))
  assert.ok(!listening.display.includes("みず"))
  assert.equal(listening.audio, "みず")
  assert.equal(listening.autoPlayAudio, true)
})

test("pickVocabReviewDirection tolerates degenerate random sources", () => {
  assert.equal(review.pickVocabReviewDirection(() => 0), "meaning")
  assert.equal(review.pickVocabReviewDirection(() => 0.5), "recall")
  assert.equal(review.pickVocabReviewDirection(() => 0.99), "listening")
  assert.equal(review.pickVocabReviewDirection(() => 1), "listening")
  assert.equal(review.pickVocabReviewDirection(() => -1), "meaning")
})
