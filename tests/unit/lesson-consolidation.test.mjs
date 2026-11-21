import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getLessonStepVersion } = await loadTsModule("src/lib/lesson-content-fingerprint.ts")
const { resolveLearningEntry, isLessonUnlocked } = await loadTsModule("src/lib/learning-entry.ts")
const { getLessonConsolidation, getRecommendedConsolidation } = await loadTsModule("src/lib/lesson-consolidation.ts")
const { resumeLessonConsolidationAttempt } = await loadTsModule("src/lib/lesson-attempt.ts")
const lesson = STARTER_LESSONS[0]
const steps = lesson.steps.filter(s => "itemId" in s)
const completed = { lessonId: lesson.id, status: "completed", startedAt: 1, completedAt: 2, score: 0 }
const answers = () => Object.fromEntries(steps.map(s => [s.id, { correct: true, createdAt: 3, questionVersion: getLessonStepVersion(s) }]))

test("zero-score completion preserves next-course access but recommends concrete consolidation", () => {
  const progress = { ...completed, stepAnswers: Object.fromEntries(steps.map(s => [s.id, { correct: false, createdAt: 3, questionVersion: getLessonStepVersion(s) }])) }
  const target = getRecommendedConsolidation({ [lesson.id]: progress })
  const entry = resolveLearningEntry({ nextLesson: STARTER_LESSONS[1], consolidation: target })
  assert.equal(entry.kind, "consolidation")
  assert.equal(entry.href, `/learn/${lesson.id}#lesson-consolidation`)
  assert.match(entry.subtitle, /0%/)
  assert.equal(isLessonUnlocked(STARTER_LESSONS[1], new Set([lesson.id])), true)
  assert.equal(progress.score, 0)
  assert.equal(getLessonConsolidation(lesson.id, progress).status, "practice")
})

test("aggregate scores, stale versions and assisted answers cannot establish course assessment", () => {
  assert.equal(getLessonConsolidation(lesson.id, { ...completed, score: 100 }).status, "unmeasured")
  const stepAnswers = answers()
  stepAnswers[steps[0].id].questionVersion = "stale"
  stepAnswers[steps[1].id].assisted = true
  const status = getLessonConsolidation(lesson.id, { ...completed, stepAnswers })
  assert.equal(status.measured, steps.length - 1)
  assert.equal(status.independentCorrect, steps.length - 2)
  assert.equal(status.status, "practice")
  assert.deepEqual(status.practiceStepIds, [steps[0].id, steps[1].id])
  const legacy = Object.fromEntries(steps.map(s => [s.id, { correct: true, createdAt: 1 }]))
  assert.equal(getLessonConsolidation(lesson.id, { ...completed, stepAnswers: legacy }).status, "unmeasured")
})

test("targeted retry retains valid answers and first completion; fresh success clears remediation", () => {
  const stepAnswers = answers()
  stepAnswers[steps[1].id].correct = false
  const progress = { ...completed, stepAnswers, hintedStepIds: [steps[1].id] }
  const retry = resumeLessonConsolidationAttempt(progress, lesson, "retry", 10)
  assert.deepEqual(retry.updateStepIds, [steps[1].id])
  assert.equal(retry.currentStepIndex, lesson.steps.findIndex(s => s.id === steps[1].id))
  assert.equal(retry.stepAnswers[steps[1].id], undefined)
  assert.deepEqual(retry.stepAnswers[steps[0].id], stepAnswers[steps[0].id])
  assert.deepEqual(retry.hintedStepIds, [])
  assert.equal(retry.completedAt, 2)
  assert.equal(retry.score, 0)
  assert.ok(Object.values(retry.supersededAnswers).some(a => a.correct === false))
  const fixed = { ...retry, stepAnswers: answers(), attemptCompletedAt: 20 }
  assert.equal(getLessonConsolidation(lesson.id, fixed).status, "passed")
  assert.equal(getRecommendedConsolidation({ [lesson.id]: fixed }), null)
  assert.equal(progress.stepAnswers[steps[1].id].correct, false)
})

test("completed course assessment requires all current questions and uses an explicit 80 percent threshold", () => {
  const longer = STARTER_LESSONS.find(l => l.steps.filter(s => "itemId" in s).length >= 5)
  const questions = longer.steps.filter(s => "itemId" in s)
  const stepAnswers = Object.fromEntries(questions.map((s, i) => [s.id, { correct: i > 0, createdAt: 3, questionVersion: getLessonStepVersion(s) }]))
  assert.equal(getLessonConsolidation(longer.id, { ...completed, lessonId: longer.id, stepAnswers }).status, "passed")
  delete stepAnswers[questions[0].id]
  assert.equal(getLessonConsolidation(longer.id, { ...completed, lessonId: longer.id, stepAnswers }).status, "practice")
  assert.equal(getRecommendedConsolidation({ [lesson.id]: { ...completed, status: "started" } }), null)
})
