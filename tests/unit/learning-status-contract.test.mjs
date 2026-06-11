import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("useLearningStatus is the shared read facade over legacy marks and item progress", () => {
  const source = read("src/lib/learning-status.ts")

  assert.match(source, /"use client"/)
  assert.match(source, /useKanaProgress/)
  assert.match(source, /useVocabProgress/)
  assert.match(source, /useLearningProgress/)
  assert.match(source, /buildLearningStatusModel/)
  assert.match(source, /masteredKanaIds/)
  assert.match(source, /learnedVocabIds/)
  assert.match(source, /isKanaMastered/)
  assert.match(source, /isVocabLearned/)
  assert.match(source, /toggleKanaMastered/)
  assert.match(source, /toggleVocabLearned/)
})

test("high-level recommendation and review surfaces use the shared learning status facade", () => {
  const recommendationHook = read("src/lib/learning-recommendation.ts")
  assert.match(recommendationHook, /useLearningStatus\(\)/)
  assert.match(recommendationHook, /buildLearningRecommendationModel\(/)
  assert.doesNotMatch(recommendationHook, /summarizeLearnedVocabIds/)

  const recommendationSurfaces = [
    "src/components/home/home-page.tsx",
    "src/components/path/skill-tree-page.tsx",
    "src/components/learning/next-step-card.tsx",
  ]

  for (const file of recommendationSurfaces) {
    const source = read(file)
    assert.match(source, /useLearningRecommendation\(\)/, file)
    assert.doesNotMatch(source, /useLearningStatus/, file)
    assert.doesNotMatch(source, /useKanaProgress/, file)
    assert.doesNotMatch(source, /useVocabProgress/, file)
  }

  const directStatusSurfaces = [
    "src/components/quiz/use-quiz-session.ts",
    "src/components/review/review-page.tsx",
  ]

  for (const file of directStatusSurfaces) {
    const source = read(file)
    assert.match(source, /useLearningStatus\(\)/, file)
    assert.doesNotMatch(source, /useKanaProgress/, file)
    assert.doesNotMatch(source, /useVocabProgress/, file)
  }

  const quizRunner = read("src/components/quiz/quiz-runner.tsx")
  assert.match(quizRunner, /useQuizSession\(mode\)/)
  assert.doesNotMatch(quizRunner, /useLearningStatus\(\)/)
})
