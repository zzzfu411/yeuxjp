import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { generateVerbConjugationQuestion } = await loadTsModule("src/lib/quiz-question-builders.ts")
const { updateItemProgressForPractice, normalizeItemProgressMap, normalizePracticeResults, averageMastery } = await loadTsModule("src/lib/learning-progress-model.ts")
const { getPathMasterySummary } = await loadTsModule("src/lib/path-page-model.ts")
const { getQuestionResponseFormat, getQuestionPracticeMode } = await loadTsModule("src/lib/questions.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { normalizeBackupEntry } = await loadTsModule("src/lib/learning-backup.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")

test("six correct conjugation choices never establish independent output evidence", () => {
  const question = generateVerbConjugationQuestion(() => 0)
  assert.equal(question.mode, "recognition")
  let items = {}
  for (let i = 0; i < 6; i++) items = updateItemProgressForPractice(items, {
    itemId: question.itemId, itemType: question.itemType, mode: question.mode,
    responseFormat: getQuestionResponseFormat(question), correct: true, createdAt: i,
  })
  const summary = getPathMasterySummary(items)
  assert.equal(summary.production, null)
  assert.equal(summary.productionAttempts, 0)
  assert.equal(items[question.itemId].recognition, 100)
})

test("legacy mixed output scores survive storage but cannot become verified independent evidence", () => {
  const legacy = { itemId: "verb:たべる:masu", itemType: "grammar", production: 100, attempts: 6, correct: 6, updatedAt: 50,
    recognition: 0, listening: 0, meaning: 0, recall: 0, assessedModes: ["production"] }
  const restored = normalizeItemProgressMap({ [legacy.itemId]: legacy })
  assert.equal(restored[legacy.itemId].production, 100, "do not erase historical aggregate")
  assert.equal(restored[legacy.itemId].attempts, 6)
  assert.equal(getPathMasterySummary(restored).production, null)
  assert.equal(averageMastery(restored[legacy.itemId]), 0)
  const updated = updateItemProgressForPractice(restored, {
    itemId: legacy.itemId, itemType: "grammar", mode: "production", responseFormat: "input", correct: true, createdAt: 60,
  })
  assert.equal(getPathMasterySummary(updated).production, 18, "new evidence starts independently of legacy 100")
  assert.equal(getPathMasterySummary(updated).productionAttempts, 1)
  assert.equal(updated[legacy.itemId].attempts, 7)
})

test("assembly, assisted input, and choice review of old typed errors do not count as independent production", () => {
  const step = STARTER_LESSONS.flatMap(l => l.steps).find(s => s.type === "sentenceBuild")
  const question = lessonStepToQuestion(step)
  assert.equal(question.responseFormat, "assembly")
  assert.equal(question.mode, "recall")
  const choiceReview = { type: "lesson:typing", mistakeId: "old-typing", mode: "production", correctAnswer: "食べます",
    options: [{ value: "食べます", display: "食べます" }, { value: "食べる", display: "食べる" }] }
  assert.equal(getQuestionResponseFormat(choiceReview), "choice")
  assert.equal(getQuestionPracticeMode(choiceReview), "recognition")
  const assisted = updateItemProgressForPractice({}, { itemId: "input", itemType: "grammar", mode: "production",
    responseFormat: "input", correct: true, assisted: true, createdAt: 1 })
  assert.equal(getPathMasterySummary(assisted).production, null)
})

test("independent input failures remain measured and format/evidence survive backup normalization", () => {
  const result = { itemId: "output", itemType: "grammar", mode: "production", responseFormat: "input", correct: false, createdAt: 1 }
  const items = normalizeItemProgressMap(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.ITEM_PROGRESS, JSON.stringify(updateItemProgressForPractice({}, result)))))
  assert.equal(getPathMasterySummary(items).production, 0)
  assert.equal(getPathMasterySummary(items).productionAttempts, 1)
  assert.equal(getPathMasterySummary(items).productionItems, 1)
  assert.equal(normalizePracticeResults([result])[0].responseFormat, "input")
})
