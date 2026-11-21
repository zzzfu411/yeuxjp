import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getLessonStepVersion, getLessonStepVersions, getLessonContentVersion } = await loadTsModule("src/lib/lesson-content-fingerprint.ts")
const { isCurrentLessonAnswer, getLessonUpdates, nextLessonStepIndex } = await loadTsModule("src/lib/lesson-content-version.ts")
const { resolveLessonStepSubmission, filterCurrentLessonAnswers, getLatestLessonStepAnswers } = await loadTsModule("src/lib/lesson-session.ts")
const { resumeLessonUpdateAttempt } = await loadTsModule("src/lib/lesson-attempt.ts")
const { applyLessonStepAnswer } = await loadTsModule("src/lib/lesson-step-answers.ts")
const { normalizeLessonProgressMap, normalizePracticeResults } = await loadTsModule("src/lib/learning-progress-model.ts")
const { normalizeBackupEntry } = await loadTsModule("src/lib/learning-backup.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const lesson = STARTER_LESSONS[0]
const step = lesson.steps.find(s => s.id === "recognize-a")
const answer = { answer: step.answer, correct: true, createdAt: 100, questionVersion: getLessonStepVersion(step) }

test("changing content under the same step ID invalidates saved scoring but presentation state does not", () => {
  assert.equal(isCurrentLessonAnswer({ ...step, attemptId: "new-ui-only" }, answer), true)
  for (const change of [{ title: "new prompt context" }, { answer: "i" }, { options: ["i", "u", "e", "o"] },
    { prompt: "Different question" }, { acceptedAnswers: ["i"] }]) {
    const edited = { ...step, ...change }
    assert.equal(isCurrentLessonAnswer(edited, answer), false)
    assert.deepEqual(filterCurrentLessonAnswers([edited], { [step.id]: answer }), {})
    const submission = resolveLessonStepSubmission(edited, edited.answer, answer)
    assert.equal(submission.shouldRecord, true)
    assert.equal(submission.result.correct, true)
  }
  assert.equal(resolveLessonStepSubmission(step, "i", answer).shouldRecord, false)
})

test("legacy compatibility accepts unchanged baseline questions and excludes corrected audit questions", () => {
  const legacy = { correct: true, answer: step.answer, createdAt: 50 }
  assert.equal(isCurrentLessonAnswer(step, legacy), true)
  assert.equal(isCurrentLessonAnswer({ ...step, prompt: "future change" }, legacy), false)
  for (const id of ["listen-ki", "d92-mc-nai", "d92-mc-contrast", "d135-build"]) {
    const corrected = STARTER_LESSONS.flatMap(l => l.steps).find(s => s.id === id)
    assert.ok(corrected)
    assert.equal(isCurrentLessonAnswer(corrected, legacy), false, id)
  }
})

test("practice logs cannot restore answers from superseded question versions", () => {
  const result = { lessonId: lesson.id, lessonStepId: step.id, itemId: step.itemId, itemType: step.itemType,
    mode: step.mode, correct: true, createdAt: 100, answer: step.answer, questionVersion: answer.questionVersion }
  assert.equal(getLatestLessonStepAnswers(lesson.id, [step], [result])[step.id].questionVersion, answer.questionVersion)
  assert.deepEqual(getLatestLessonStepAnswers(lesson.id, [{ ...step, answer: "i" }], [result]), {})
  assert.equal(normalizePracticeResults([result])[0].questionVersion, answer.questionVersion)
})

test("update-only attempts skip unchanged content, retain first completion, and archive replaced answers", () => {
  const original = { lessonId: lesson.id, status: "completed", startedAt: 10, completedAt: 90, score: 75,
    completedContentVersion: getLessonContentVersion(lesson), completedStepVersions: getLessonStepVersions(lesson),
    stepAnswers: { [step.id]: answer } }
  assert.deepEqual(getLessonUpdates(lesson, original), [])
  const editedStep = { ...step, answer: "i", prompt: "Revised prompt" }
  const edited = { ...lesson, steps: lesson.steps.map(s => s.id === step.id ? editedStep : s) }
  assert.deepEqual(getLessonUpdates(edited, original).map(s => s.id), [step.id])
  const resumed = resumeLessonUpdateAttempt(original, edited, "update-round", 200)
  assert.equal(resumed.score, 75)
  assert.equal(resumed.completedAt, 90)
  assert.equal(resumed.attemptCompletedAt, undefined)
  assert.deepEqual(resumed.updateStepIds, [step.id])
  assert.equal(edited.steps[nextLessonStepIndex(edited, resumed.currentStepIndex, 1, resumed.updateStepIds)].type, "summary")
  const newAnswer = { ...answer, answer: "i", questionVersion: getLessonStepVersion(editedStep), createdAt: 210 }
  const stored = applyLessonStepAnswer({ [lesson.id]: resumed }, lesson.id, step.id, newAnswer, 210)
  const restored = normalizeLessonProgressMap(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(stored))))[lesson.id]
  assert.deepEqual(restored.supersededAnswers[`${step.id}@${answer.questionVersion}`], answer)
  assert.deepEqual(restored.stepAnswers[step.id], newAnswer)
  assert.equal(restored.score, 75)
  assert.equal(restored.completedAt, 90)
  assert.deepEqual(restored.completedStepVersions, original.completedStepVersions)
})

test("new or revised reading material appears in the update difference", () => {
  const original = { lessonId: lesson.id, status: "completed", startedAt: 10,
    completedStepVersions: getLessonStepVersions(lesson) }
  const edited = { ...lesson, study: { ...lesson.study, reading: `${lesson.study.reading} 新しい文章。` } }
  assert.ok(getLessonUpdates(edited, original).some(s => s.type === "example"))
  const added = { ...lesson, steps: [...lesson.steps.slice(0, -1), { ...step, id: "new-question" }, lesson.steps.at(-1)] }
  assert.deepEqual(getLessonUpdates(added, original).map(s => s.id), ["new-question"])
})
