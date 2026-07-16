import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const today = await loadTsModule("src/lib/today-review-session.ts")

test("today review completion copy distinguishes a capped batch from a cleared queue", () => {
  assert.equal(today.getTodayReviewBatchCompletionTitle(0), "今日复习完成")
  assert.equal(today.getTodayReviewBatchCompletionTitle(12), "本轮复习完成，仍有 12 项到期")
  assert.equal(today.getTodayReviewBatchCompletionTitle(-1), "今日复习完成")
  assert.equal(today.getTodayReviewBatchCompletionTitle(Number.NaN), "今日复习完成")
})

const vocabPool = [
  { id: "v1", kanji: "水", kana: "みず", romaji: "mizu", meaning: "water", category: "food", level: "survival" },
  { id: "v2", kanji: "茶", kana: "ちゃ", romaji: "cha", meaning: "tea", category: "food", level: "survival" },
  { id: "v3", kana: "ごはん", romaji: "gohan", meaning: "rice", category: "food", level: "survival" },
  { id: "v4", kana: "パン", romaji: "pan", meaning: "bread", category: "food", level: "survival" },
]

function mistake(overrides = {}) {
  return {
    id: "m1",
    type: "review:vocab",
    questionText: "水",
    questionAudio: "みず",
    itemId: "v1",
    itemType: "vocab",
    mode: "meaning",
    correctAnswer: "v1",
    correctDisplay: "water",
    options: [{ value: "v2", display: "tea" }],
    wrongCount: 1,
    createdAt: 1,
    lastWrongAt: 2,
    ...overrides,
  }
}

function deck({ has = true, grade = true } = {}) {
  const calls = []
  return {
    calls,
    has: (id) => {
      calls.push(["has", id])
      return has
    },
    gradeExisting: (id, result) => {
      calls.push(["gradeExisting", id, result])
      return grade
    },
  }
}

function decks() {
  return {
    kana: deck(),
    vocab: deck(),
    mistakes: deck(),
  }
}

test("today review adapter displays hiragana and katakana a independently", () => {
  for (const expected of [
    { id: "hiragana:a", glyph: "あ", otherGlyph: "ア", scriptLabel: "平假名" },
    { id: "katakana:a", glyph: "ア", otherGlyph: "あ", scriptLabel: "片假名" },
  ]) {
    const resolved = today.resolveTodayReviewItemData({
      current: { deck: "kana", id: expected.id },
      vocabulary: [],
      mistakes: new Map(),
    })

    assert.equal(resolved.missingReviewEntry, false)
    assert.equal(resolved.insufficientQuestionOptions, false)
    assert.equal(resolved.data.deckLabel, "假名")
    assert.equal(resolved.data.prompt, expected.glyph)
    assert.equal(resolved.data.sub, expected.scriptLabel)
    assert.equal(resolved.data.audio, expected.glyph)
    assert.equal(resolved.data.question.itemId, expected.id)
    assert.equal(resolved.data.question.itemType, "kana")
    assert.equal(resolved.data.question.mode, "recognition")
    assert.equal(resolved.data.question.questionText, expected.glyph)
    assert.equal(resolved.data.prompt.includes(expected.otherGlyph), false)
    assert.equal(resolved.data.question.questionText.includes(expected.otherGlyph), false)
  }
})

test("today review adapter resolves vocabulary items with loaded distractor pools", () => {
  const resolved = today.resolveTodayReviewItemData({
    current: { deck: "vocab", id: "v1" },
    vocabulary: vocabPool,
    mistakes: new Map(),
    seed: "seed-a",
  })

  assert.equal(resolved.missingReviewEntry, false)
  assert.equal(resolved.insufficientQuestionOptions, false)
  assert.equal(resolved.data.deckLabel, "词汇")

  const question = resolved.data.question
  assert.equal(question.itemId, "v1")
  assert.equal(question.itemType, "vocab")
  assert.equal(question.correctAnswer, "v1")
  assert.ok(["meaning", "recall", "listening"].includes(question.mode))

  if (question.mode === "meaning") {
    assert.equal(resolved.data.prompt, "水")
    assert.equal(resolved.data.audio, "みず")
    assert.equal(resolved.data.autoPlayAudio, true)
  } else if (question.mode === "recall") {
    assert.equal(resolved.data.prompt, "water")
    assert.equal(resolved.data.audio, undefined)
    assert.equal(resolved.data.autoPlayAudio, false)
  } else {
    assert.ok(!resolved.data.prompt.includes("水"))
    assert.ok(!resolved.data.prompt.includes("みず"))
    assert.equal(resolved.data.audio, "みず")
    assert.equal(resolved.data.autoPlayAudio, true)
  }
})

test("today review adapter is deterministic per seed so answers cannot reshuffle the current question", () => {
  const resolveVocab = () =>
    today.resolveTodayReviewItemData({
      current: { deck: "vocab", id: "v1" },
      vocabulary: vocabPool,
      mistakes: new Map(),
      seed: "stable-seed",
    })
  assert.deepEqual(resolveVocab(), resolveVocab())

  const resolveKana = () =>
    today.resolveTodayReviewItemData({
      current: { deck: "kana", id: "hiragana:a" },
      vocabulary: [],
      mistakes: new Map(),
      seed: "stable-seed",
    })
  assert.deepEqual(resolveKana(), resolveKana())
})

test("today review vocabulary directions rotate across seeds", () => {
  const modes = new Set()
  for (let index = 0; index < 60 && modes.size < 3; index += 1) {
    const resolved = today.resolveTodayReviewItemData({
      current: { deck: "vocab", id: "v1" },
      vocabulary: vocabPool,
      mistakes: new Map(),
      seed: `seed-${index}`,
    })
    modes.add(resolved.data.question.mode)
  }
  assert.equal(modes.size, 3)
})

test("createSeededRandom yields identical unit-interval sequences for identical seeds", () => {
  const first = today.createSeededRandom("k")
  const second = today.createSeededRandom("k")
  const sequenceA = [first(), first(), first()]
  const sequenceB = [second(), second(), second()]

  assert.deepEqual(sequenceA, sequenceB)
  for (const value of sequenceA) {
    assert.ok(value >= 0 && value < 1)
  }
})

test("today review adapter resolves mistakes and preserves mistake history metadata", () => {
  const item = mistake({ id: "m2", questionText: undefined, questionAudio: undefined })
  const resolved = today.resolveTodayReviewItemData({
    current: { deck: "mistakes", id: "m2" },
    vocabulary: vocabPool,
    mistakes: new Map([["m2", item]]),
  })

  assert.equal(resolved.missingReviewEntry, false)
  assert.equal(resolved.insufficientQuestionOptions, false)
  assert.equal(resolved.data.deckLabel, "错题")
  assert.equal(resolved.data.prompt, "（无题干）")
  assert.equal(resolved.data.sub, "review:vocab")
  assert.equal(resolved.data.question.mistakeId, "m2")
  assert.equal(resolved.data.question.itemId, "v1")
  assert.equal(resolved.data.question.correctAnswer, "v1")
  assert.equal(resolved.data.question.options.some((option) => option.value === "v1"), true)
})

test("today review adapter distinguishes missing records from undersized questions", () => {
  const missing = today.resolveTodayReviewItemData({
    current: { deck: "vocab", id: "missing" },
    vocabulary: vocabPool,
    mistakes: new Map(),
  })
  const undersized = today.resolveTodayReviewItemData({
    current: { deck: "vocab", id: "v1" },
    vocabulary: vocabPool.slice(0, 2),
    mistakes: new Map(),
  })

  assert.deepEqual(missing, {
    data: null,
    missingReviewEntry: true,
    insufficientQuestionOptions: false,
  })
  assert.deepEqual(undersized, {
    data: null,
    missingReviewEntry: false,
    insufficientQuestionOptions: true,
  })
})

test("today review adapter centralizes SRS recordability, grading, and item keys", () => {
  const srs = decks()

  assert.equal(today.getTodayReviewItemKey({ deck: "vocab", id: "v1" }), "vocab:v1")
  assert.equal(today.getTodayReviewItemKey({ deck: "kana", id: "hiragana:a" }), "kana:hiragana:a")
  assert.equal(today.getTodayReviewItemKey({ deck: "kana", id: "katakana:a" }), "kana:katakana:a")
  assert.equal(today.getTodayReviewItemKey(null), null)
  assert.equal(today.canRecordTodayReviewItem({ deck: "kana", id: "hiragana:a" }, srs), true)
  assert.deepEqual(srs.kana.calls.at(-1), ["has", "hiragana:a"])

  assert.equal(today.gradeTodayReviewItem({ deck: "kana", id: "katakana:a" }, { correct: true }, srs), true)
  assert.deepEqual(srs.kana.calls.at(-1), ["gradeExisting", "katakana:a", "good"])
  assert.equal(today.gradeTodayReviewItem({ deck: "vocab", id: "v1" }, { correct: false }, srs), true)
  assert.deepEqual(srs.vocab.calls.at(-1), ["gradeExisting", "v1", "again"])

  const beforeWrongMistakeCalls = srs.mistakes.calls.length
  assert.equal(today.gradeTodayReviewItem({ deck: "mistakes", id: "m1" }, { correct: false }, srs), true)
  assert.equal(srs.mistakes.calls.length, beforeWrongMistakeCalls)
  assert.equal(today.gradeTodayReviewItem({ deck: "mistakes", id: "m1" }, { correct: true }, srs), true)
  assert.deepEqual(srs.mistakes.calls.at(-1), ["gradeExisting", "m1", "good"])
  assert.equal(today.gradeTodayReviewItem(null, { correct: true }, srs), false)
})
