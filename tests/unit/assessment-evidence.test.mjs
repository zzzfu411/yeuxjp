import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { CURRENT_ASSESSMENT_REVISION, getUnverifiedAssessmentModes, getModeMastery } = await loadTsModule("src/lib/assessment-evidence.ts")
const { updateItemProgressForPractice, averageMastery, getAssessedModes, normalizeItemProgressMap, normalizePracticeResults } = await loadTsModule("src/lib/learning-progress-model.ts")
const { normalizeBackupEntry } = await loadTsModule("src/lib/learning-backup.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
const { AUDIT_AFFECTED_MODES } = await loadTsModule("src/data/audit-affected-modes.ts")
const grammarId = Object.values(grammarData).flat().find(p => p.practiceTemplates?.length).id
const legacy = (itemId, itemType, mode) => ({ itemId, itemType, recognition: 0, listening: 0, meaning: 0, recall: 0, production: 0,
  [mode]: 100, assessedModes: [mode], attempts: 6, correct: 6, updatedAt: 50 })
const result = (item, correct = true) => ({ itemId: item.itemId, itemType: item.itemType, mode: item.assessedModes[0], correct,
  assessmentRevision: CURRENT_ASSESSMENT_REVISION, responseFormat: "choice", createdAt: 100 })

test("only affected historical modes require new evidence, with original scores and other abilities preserved", () => {
  const listening = STARTER_LESSONS.flatMap(l => l.steps).find(s => s.title === "听音选择")
  const cases = [legacy(grammarId, "grammar", "recognition"), legacy("sur-v-62", "vocab", "recall"),
    legacy("hiragana:ji", "kana", "listening"), legacy(listening.itemId, listening.itemType, "listening")]
  for (const item of cases) {
    const mode = item.assessedModes[0]
    const restored = normalizeItemProgressMap({ [item.itemId]: item })[item.itemId]
    assert.equal(restored[mode], 100)
    assert.deepEqual(getUnverifiedAssessmentModes(restored), [mode])
    assert.equal(averageMastery(restored), 0)
    const otherMode = ["recognition", "listening", "meaning", "recall"].find(candidate => !AUDIT_AFFECTED_MODES[`${item.itemType}:${item.itemId}`]?.includes(candidate))
    assert.ok(otherMode)
    const withOther = { ...restored, [otherMode]: 80, assessedModes: [mode, otherMode] }
    assert.equal(averageMastery(withOther), 80)
    assert.deepEqual(getAssessedModes(withOther), [otherMode])
    const updated = updateItemProgressForPractice({ [item.itemId]: item }, result(item))[item.itemId]
    assert.equal(updated[mode], 100, "historical aggregate retained")
    assert.equal(getModeMastery(updated, mode), 18, "new sample cannot inherit the old 100")
    assert.deepEqual(getUnverifiedAssessmentModes(updated), [])
    assert.equal(updated.attempts, 7)
  }
  assert.equal(averageMastery(legacy("outside-audited-sources", "vocab", "meaning")), 100)
})

test("legacy log replays, assisted answers, and unrelated new modes do not rehabilitate affected evidence", () => {
  const item = legacy(grammarId, "grammar", "recognition")
  for (const change of [{ assessmentRevision: undefined }, { assessmentRevision: "old" }, { assisted: true }]) {
    const updated = updateItemProgressForPractice({ [item.itemId]: item }, { ...result(item), ...change })[item.itemId]
    assert.deepEqual(getUnverifiedAssessmentModes(updated), ["recognition"])
    assert.equal(updated.assessmentEvidence?.recognition, undefined)
  }
  const other = updateItemProgressForPractice({ [item.itemId]: item }, { ...result(item), mode: "meaning" })[item.itemId]
  assert.deepEqual(getUnverifiedAssessmentModes(other), ["recognition"])
  assert.equal(averageMastery(other), 18)
})

test("new wrong answers count as measured zero and both evidence generations survive backup restore", () => {
  const item = legacy(grammarId, "grammar", "recognition")
  const updated = updateItemProgressForPractice({ [item.itemId]: item }, result(item, false))
  const restored = JSON.parse(normalizeBackupEntry(STORAGE_KEYS.ITEM_PROGRESS, JSON.stringify(updated)))[item.itemId]
  assert.equal(restored.recognition, 90)
  assert.deepEqual(restored.assessmentEvidence.recognition, { score: 0, attempts: 1, correct: 0 })
  assert.deepEqual(getAssessedModes(restored), ["recognition"])
  assert.equal(averageMastery(restored), 0)
  assert.equal(normalizePracticeResults([result(item)])[0].assessmentRevision, CURRENT_ASSESSMENT_REVISION)
})
