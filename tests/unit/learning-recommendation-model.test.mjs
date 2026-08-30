import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const recommendation = await loadTsModule("src/lib/learning-recommendation-model.ts")

const kana = [
  { romaji: "a", hiragana: "a", katakana: "A", type: "seion" },
  { romaji: "ga", hiragana: "ga", katakana: "GA", type: "dakuon" },
  { romaji: "kya", hiragana: "kya", katakana: "KYA", type: "yoon" },
  { romaji: "sokuon", hiragana: "sokuon", katakana: "SOKUON", type: "special" },
]

const learnedSurvivalIds = [
  ...Array.from({ length: 30 }, (_, index) => `sur-g-${index + 1}`),
  ...Array.from({ length: 81 }, (_, index) => `sur-v-${index + 1}`),
  ...Array.from({ length: 26 }, (_, index) => `sur-adj-${index + 1}`),
]

test("learning recommendation model prefers the next starter lesson over the skill fallback", () => {
  const model = recommendation.buildLearningRecommendationModel({
    kana,
    isKanaMastered: () => false,
    learnedVocabIds: [],
    nextLesson: { id: "day-1", title: "Day 1", subtitle: "Start here" },
    skillTree: [{ id: "kana-seion", title: "Seion", short: "Basic kana", href: "/kana?set=seion" }],
  })

  assert.equal(model.nextSkillId, "kana-seion")
  assert.equal(model.recommendedSkill.title, "Seion")
  assert.equal(model.learningEntry.kind, "lesson")
  assert.equal(model.learningEntry.href, "/learn/day-1")
})

test("learning recommendation model falls back to the recommended skill after lessons", () => {
  const model = recommendation.buildLearningRecommendationModel({
    kana,
    isKanaMastered: () => true,
    learnedVocabIds: learnedSurvivalIds,
    nextLesson: null,
    skillTree: [{ id: "vocab-daily", title: "Daily", short: "Daily words", href: "/vocabulary?level=daily" }],
  })

  assert.equal(model.nextSkillId, "vocab-daily")
  assert.equal(model.vocabStats.survival.done, 137)
  assert.equal(model.learningEntry.kind, "skill")
  assert.equal(model.learningEntry.href, "/vocabulary?level=daily")
})

test("learning recommendation model uses review when the recommended skill is unavailable", () => {
  const model = recommendation.buildLearningRecommendationModel({
    kana,
    isKanaMastered: () => true,
    learnedVocabIds: learnedSurvivalIds,
    nextLesson: null,
    skillTree: [],
  })

  assert.equal(model.nextSkillId, "vocab-daily")
  assert.equal(model.recommendedSkill, null)
  assert.equal(model.learningEntry.kind, "review")
  assert.equal(model.learningEntry.href, "/review")
})
