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
  const learnedSurvivalIds = Array.from({ length: 130 }, (_, index) => `sur-test-${index}`)

  const model = recommendation.buildLearningRecommendationModel({
    kana,
    isKanaMastered: () => true,
    learnedVocabIds: learnedSurvivalIds,
    nextLesson: null,
    skillTree: [{ id: "particles-basic", title: "Particles", short: "Basic particles", href: "/quiz?mode=particle" }],
  })

  assert.equal(model.nextSkillId, "particles-basic")
  assert.equal(model.vocabStats.survival.done, 130)
  assert.equal(model.learningEntry.kind, "skill")
  assert.equal(model.learningEntry.href, "/quiz?mode=particle")
})

test("learning recommendation model uses review when the recommended skill is unavailable", () => {
  const model = recommendation.buildLearningRecommendationModel({
    kana,
    isKanaMastered: () => true,
    learnedVocabIds: Array.from({ length: 130 }, (_, index) => `sur-test-${index}`),
    nextLesson: null,
    skillTree: [],
  })

  assert.equal(model.nextSkillId, "particles-basic")
  assert.equal(model.recommendedSkill, null)
  assert.equal(model.learningEntry.kind, "review")
  assert.equal(model.learningEntry.href, "/review")
})
