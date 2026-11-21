import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const data = await loadTsModule("src/data/stage-diagnostics.ts")
const model = await loadTsModule("src/lib/stage-diagnostic-model.ts")
const storage = await loadTsModule("src/lib/stage-diagnostic-storage.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { normalizeBackupEntry, normalizeLearningBackup, LEARNING_BACKUP_VERSION } = await loadTsModule("src/lib/learning-backup.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { STAGE_WRITING_TASKS } = await loadTsModule("src/data/stage-writing-tasks.ts")
const skip = await loadTsModule("src/lib/lesson-skip.ts")
const entry = await loadTsModule("src/lib/learning-entry.ts")
const { getRecommendedConsolidation } = await loadTsModule("src/lib/lesson-consolidation.ts")
const { countPhaseProgress } = await loadTsModule("src/lib/course-phases.ts")
const { buildHomePageModel } = await loadTsModule("src/lib/home-page-model.ts")
const phases = Object.keys(data.STAGE_DIAGNOSTICS)
function finish(phase = "n5", wrong = [], transform = a => a) {
  let attempt = model.createDiagnosticAttempt(phase, "attempt", 0)
  let store = { attempts: { attempt } }
  for (const q of attempt.questions) {
    if (q.audio) store = model.applyDiagnosticAction(store, { type: "heard", id: attempt.id, questionId: q.id }, 1)
    store = model.applyDiagnosticAction(store, { type: "answer", id: attempt.id, questionId: q.id, value: wrong.includes(q.id) ? "" : q.answer }, 2)
  }
  attempt = transform(store.attempts.attempt)
  return { attempts: { attempt } }
}
function install(fail = false) {
  const map = new Map()
  global.window = { localStorage: { getItem: key => map.get(key) ?? null, setItem: (key, value) => { if (fail) throw Error("quota"); map.set(key, value) }, removeItem: key => map.delete(key) }, dispatchEvent: () => true }
  global.CustomEvent = class extends Event { constructor(type, init) { super(type); this.detail = init?.detail } }
  return map
}
test("four independent 16-question diagnostics cover all domains with no duplicate material from the course or works", () => {
  const coursePrompts = new Set(STARTER_LESSONS.flatMap(l => l.steps.map(s => s.prompt).filter(Boolean)))
  const courseMaterials = new Set([...STARTER_LESSONS.flatMap(l => l.steps.flatMap(s => [s.passage, s.audioText]).filter(Boolean)), ...STAGE_WRITING_TASKS.map(t => t.passage)])
  const ids = new Set()
  for (const phase of phases) {
    const questions = data.STAGE_DIAGNOSTICS[phase]
    assert.equal(questions.length, 16)
    for (const domain of model.DIAGNOSTIC_DOMAINS) assert.equal(questions.filter(q => q.domain === domain).length, 4)
    assert.equal(questions.filter(q => q.readingInput).length, 2)
    for (const q of questions) {
      assert.ok(!ids.has(q.id)); ids.add(q.id)
      assert.ok(!coursePrompts.has(q.prompt), q.id)
      assert.ok(!courseMaterials.has(q.passage ?? q.audio), q.id)
      assert.ok(q.explanation.trim())
      if (!q.readingInput) { assert.equal(new Set(q.options).size, 4); assert.ok(q.options.includes(q.answer)) }
      if (q.domain === "listening") assert.ok(q.audio && !q.passage)
    }
    const store = finish(phase)
    assert.ok(model.summarizeDiagnostic(store.attempts.attempt).passed)
    assert.deepEqual(model.normalizeDiagnosticStore(JSON.parse(JSON.stringify(store))), store)
    const canonical = model.createDiagnosticAttempt(phase, "attempt", 0)
    canonical.questions = canonical.questions.map(q => Object.fromEntries(Object.entries(q).reverse()))
    assert.ok(model.diagnosticDefinitionIsCurrent(canonical), "object property order must not change content identity")
  }
})
test("total, each domain, kanji reading and full completion are all required; N2 does not invent a next stage", () => {
  assert.equal(model.summarizeDiagnostic(finish("n5", ["n5-g1", "n5-g2", "n5-g3"]).attempts.attempt).passed, false)
  assert.equal(model.summarizeDiagnostic(finish("n5", ["n5-w1", "n5-w2"]).attempts.attempt).passed, false)
  assert.equal(model.summarizeDiagnostic(finish("n5", ["n5-g1", "n5-g2", "n5-l1"]).attempts.attempt).passed, true)
  assert.equal(model.summarizeDiagnostic(finish("n5", ["n5-g1", "n5-g2", "n5-l1", "n5-r1"]).attempts.attempt).passed, false)
  const unfinished = model.createDiagnosticAttempt("n5", "new", 0)
  assert.equal(model.summarizeDiagnostic(unfinished).passed, false)
  assert.equal(model.summarizeDiagnostic(finish("n2").attempts.attempt).entryOrder, null)
  const allZero = finish("n5").attempts.attempt
  allZero.completedAt = 0
  assert.equal(model.summarizeDiagnostic(allZero).complete, true, "epoch timestamps are not absent")
})
test("shared transcript assistance, absent playback and external references never become independent listening", () => {
  const attempt = finish().attempts.attempt
  const unheard = { ...attempt, heardAudio: [] }
  assert.equal(model.summarizeDiagnostic(unheard).passed, false)
  const audio = model.diagnosticAudioId(attempt.questions.find(q => q.id === "n5-l2"))
  const assisted = { ...attempt, assistedAudio: [audio] }
  const rows = model.summarizeDiagnostic(assisted).rows.filter(row => ["n5-l1", "n5-l2"].includes(row.question.id))
  assert.ok(rows.every(row => !row.independentCorrect))
  assert.equal(model.summarizeDiagnostic({ ...attempt, usedReferences: true }).correct, 0)
})
test("forward-only answers resume exactly, reject double clicks, and stable shuffled options resist fixed-position guessing", () => {
  let store = model.applyDiagnosticAction(model.EMPTY_DIAGNOSTIC_STORE, { type: "start", phase: "n5", id: "a" }, 0)
  assert.equal(model.applyDiagnosticAction(store, { type: "answer", id: "a", questionId: "n5-w2", value: "げつようび" }, 1), null)
  store = model.applyDiagnosticAction(store, { type: "answer", id: "a", questionId: "n5-w1", value: "ガッコウ" }, 1)
  assert.equal(model.summarizeDiagnostic(store.attempts.a).correct, 1)
  assert.equal(model.applyDiagnosticAction(store, { type: "answer", id: "a", questionId: "n5-w1", value: "bad" }, 2), null)
  assert.equal(model.applyDiagnosticAction(store, { type: "start", phase: "n5", id: "a" }, 2), null)
  assert.equal(model.normalizeDiagnosticStore(JSON.parse(JSON.stringify(store))).attempts.a.answers["n5-w1"].value, "ガッコウ")
  for (const phase of phases) for (let seed = 0; seed < 20; seed++) {
    const qs = data.STAGE_DIAGNOSTICS[phase].filter(q => q.options.length)
    assert.ok(qs.filter(q => model.diagnosticOptions(q, String(seed))[0] === q.answer).length < 10)
    for (const q of qs) assert.deepEqual(model.diagnosticOptions(q, String(seed)), model.diagnosticOptions(q, String(seed)))
  }
})
test("adopting placement never creates completions; prior courses remain readable and consolidation follows the entry", () => {
  for (const [phase, order] of [["n5", 46], ["n4", 91], ["n3", 136]]) {
    const store = model.applyDiagnosticAction(finish(phase), { type: "adopt", id: "attempt" }, 10)
    assert.equal(model.getDiagnosticEntryOrder(store), order)
    const done = new Set()
    assert.equal(skip.getNextCourseLesson(STARTER_LESSONS, done, "none", order).order, order)
    assert.equal(skip.countSatisfiedLessons(STARTER_LESSONS, done, "none", order), order - 1)
    assert.ok(STARTER_LESSONS.filter(l => l.order <= order).every(l => entry.isLessonUnlocked(l, done, "none", order)))
    assert.equal(entry.isLessonUnlocked(STARTER_LESSONS[order], done, "none", order), false)
    assert.equal(done.size, 0)
    const home = buildHomePageModel({ completedLessonIds: done, items: {}, kanaDueIds: [], vocabDueIds: [], mistakeDueIds: [], mistakeIds: [], entryOrder: order })
    assert.equal(home.nextLesson.order, order)
    assert.equal(home.completedCount, 0)
    assert.equal(home.skippedCount, order - 1)
    assert.equal(countPhaseProgress(STARTER_LESSONS, done, "starter-45", "none", order).done, 0)
    const early = STARTER_LESSONS[0]
    const progress = { [early.id]: { lessonId: early.id, status: "completed", startedAt: 1, completedAt: 2, score: 75 } }
    assert.ok(getRecommendedConsolidation(progress))
    assert.equal(getRecommendedConsolidation(progress, order), null)
    assert.equal(model.getDiagnosticEntryOrder(model.applyDiagnosticAction(store, { type: "reset-entry" }, 12)), 1)
  }
  const higher = STARTER_LESSONS[91]
  assert.equal(entry.isLessonUnlocked(higher, new Set([higher.id]), "none", 1), true, "completed lessons survive revoked placement")
  assert.equal(skip.getNextCourseLesson(STARTER_LESSONS, new Set(), "none", 999).order, 1)
})
test("old material snapshots remain in backups but cannot certify the current entry; malformed snapshots block writes", () => {
  const store = finish()
  const attempt = store.attempts.attempt
  attempt.questions[0].prompt += "（旧版）"
  attempt.version = data.diagnosticSnapshotVersion(attempt.rules, attempt.questions)
  store.entryAttemptId = "attempt"
  assert.ok(model.normalizeDiagnosticStore(store))
  assert.equal(model.getDiagnosticEntryOrder(store), 1)
  assert.equal(model.applyDiagnosticAction(store, { type: "adopt", id: "attempt" }, 20), null)
  const raw = JSON.stringify(store)
  assert.deepEqual(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.DIAGNOSTICS, raw)), store)
  assert.equal(normalizeLearningBackup({ version: 7, exportedAt: 10, entries: {} }).version, LEARNING_BACKUP_VERSION)
  attempt.questions[0].answer = "changed without version"
  assert.equal(model.normalizeDiagnosticStore(store), null)
  const map = install()
  map.set(STORAGE_KEYS.DIAGNOSTICS, "{broken")
  assert.equal(storage.saveDiagnosticAction({ type: "start", phase: "n5", id: "a" }), false)
  assert.equal(map.get(STORAGE_KEYS.DIAGNOSTICS), "{broken")
  install(true)
  assert.equal(storage.saveDiagnosticAction({ type: "start", phase: "n5", id: "a" }), false)
})
