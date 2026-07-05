import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/quiz-runner-model.ts")

test("quiz preflight reports vocabulary loading and load errors before generating questions", () => {
  assert.equal(
    model.getQuizPreflightEmptyReason({
      mode: "meaning-vocab",
      vocabLoading: false,
      vocabError: true,
    }),
    "load-error"
  )
  assert.equal(
    model.getQuizPreflightEmptyReason({
      mode: "meaning-vocab",
      vocabLoading: true,
      vocabError: true,
    }),
    "loading"
  )
  assert.equal(
    model.getQuizPreflightEmptyReason({
      mode: "meaning-vocab",
      vocabLoading: true,
      vocabError: false,
    }),
    "loading"
  )
  assert.equal(
    model.getQuizPreflightEmptyReason({
      mode: "meaning-vocab",
      vocabLoading: false,
      vocabError: false,
    }),
    null
  )
  assert.equal(
    model.getQuizPreflightEmptyReason({
      mode: "audio-kana",
      vocabLoading: true,
      vocabError: true,
    }),
    null
  )
})

test("quiz no-question reason distinguishes exhausted filters from undersized pools", () => {
  assert.equal(
    model.getQuizNoQuestionReason({
      mode: "hiragana-romaji",
      onlyUnmasteredKana: true,
      onlyUnlearnedVocab: false,
    }),
    "filter-empty"
  )
  assert.equal(
    model.getQuizNoQuestionReason({
      mode: "audio-kana",
      onlyUnmasteredKana: true,
      onlyUnlearnedVocab: false,
    }),
    "filter-empty"
  )
  assert.equal(
    model.getQuizNoQuestionReason({
      mode: "meaning-vocab",
      onlyUnmasteredKana: false,
      onlyUnlearnedVocab: true,
    }),
    "filter-empty"
  )
  assert.equal(
    model.getQuizNoQuestionReason({
      mode: "particle",
      onlyUnmasteredKana: true,
      onlyUnlearnedVocab: true,
    }),
    "pool-too-small"
  )
})

test("quiz speech option visibility is limited to audio-sensitive modes", () => {
  assert.equal(model.shouldShowQuizSpeechOptions("audio-kana"), true)
  assert.equal(model.shouldShowQuizSpeechOptions("audio-sokuon"), true)
  assert.equal(model.shouldShowQuizSpeechOptions("audio-longvowel"), true)
  assert.equal(model.shouldShowQuizSpeechOptions("particle"), true)
  assert.equal(model.shouldShowQuizSpeechOptions("hiragana-romaji"), false)
  assert.equal(model.shouldShowQuizSpeechOptions("meaning-vocab"), false)
  assert.equal(model.shouldShowQuizSpeechOptions("verb-conjugation"), false)
})
