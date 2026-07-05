import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const quiz = await loadTsModule("src/lib/quiz-generators.ts")

const vocab = [
  { id: "v1", kana: "みず", romaji: "mizu", meaning: "水", category: "food", level: "survival" },
  { id: "v2", kana: "ちゃ", romaji: "cha", meaning: "茶", category: "food", level: "survival" },
  { id: "v3", kana: "ごはん", romaji: "gohan", meaning: "饭", category: "food", level: "survival" },
  { id: "v4", kana: "パン", romaji: "pan", meaning: "面包", category: "food", level: "survival" },
]

test("parseQuizMode accepts only known quiz modes", () => {
  assert.equal(quiz.parseQuizMode("meaning-vocab"), "meaning-vocab")
  assert.equal(quiz.parseQuizMode("unknown"), null)
})

test("kana quiz generators return shared Question objects", () => {
  const base = quiz.getKanaPool("seion")
  const question = quiz.generateQuizQuestion({
    mode: "hiragana-romaji",
    kanaBasePool: base,
    kanaTargetPool: base,
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(question.itemType, "kana")
  assert.equal(question.mode, "recognition")
  assert.equal(question.correctAnswer, "a")
  assert.equal(question.options.length, 4)
})

test("quiz generators tolerate invalid injected random values", () => {
  const base = quiz.getKanaPool("seion")
  const kanaQuestion = quiz.generateQuizQuestion({
    mode: "hiragana-romaji",
    kanaBasePool: base,
    kanaTargetPool: base,
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => Number.POSITIVE_INFINITY,
  })
  const vocabQuestion = quiz.generateQuizQuestion({
    mode: "meaning-vocab",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => Number.NaN,
  })

  assert.equal(kanaQuestion.itemType, "kana")
  assert.equal(kanaQuestion.correctAnswer, "a")
  assert.equal(kanaQuestion.options.length, 4)
  assert.equal(vocabQuestion.itemType, "vocab")
  assert.equal(vocabQuestion.correctAnswer, "v1")
  assert.equal(vocabQuestion.options.length, 4)
})

test("kana quiz generators require enough unique options", () => {
  const base = quiz.getKanaPool("seion").slice(0, 3)
  const question = quiz.generateQuizQuestion({
    mode: "hiragana-romaji",
    kanaBasePool: base,
    kanaTargetPool: base,
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(question, null)
})

test("kana unmastered filter stays empty when every item is mastered", () => {
  const base = quiz.getKanaPool("seion").slice(0, 4)

  assert.deepEqual(
    quiz.filterUnmasteredKana(base, () => true, true),
    []
  )
  assert.deepEqual(
    quiz.filterUnmasteredKana(base, () => true, false),
    base
  )
})

test("vocabulary quiz generators return meaning questions", () => {
  const question = quiz.generateQuizQuestion({
    mode: "meaning-vocab",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(question.itemType, "vocab")
  assert.equal(question.mode, "meaning")
  assert.equal(question.correctAnswer, "v1")
  assert.equal(question.options.length, 4)
})

test("vocabulary quiz generators require enough unique options", () => {
  const smallVocab = vocab.slice(0, 3)
  const question = quiz.generateQuizQuestion({
    mode: "meaning-vocab",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: smallVocab,
    vocabTargetPool: smallVocab,
    random: () => 0,
  })

  assert.equal(question, null)
})

test("vocabulary unlearned filter stays empty when every item is learned", () => {
  assert.deepEqual(
    quiz.filterUnlearnedVocab(vocab, () => true, true),
    []
  )
  assert.deepEqual(
    quiz.filterUnlearnedVocab(vocab, () => true, false),
    vocab
  )
})

test("audio contrast and verb conjugation modes include explanations or audio", () => {
  const audio = quiz.generateQuizQuestion({
    mode: "audio-sokuon",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })
  const verb = quiz.generateQuizQuestion({
    mode: "verb-conjugation",
    kanaBasePool: [],
    kanaTargetPool: [],
    vocabBasePool: vocab,
    vocabTargetPool: vocab,
    random: () => 0,
  })

  assert.equal(audio.itemType, "kana")
  assert.ok(audio.questionAudio)
  assert.equal(verb.itemType, "grammar")
  assert.ok(verb.explanation)
  assert.match(verb.questionText, /（吃）/)
  assert.doesNotMatch(verb.questionText, /\{verb\.meaning\}/)
})
