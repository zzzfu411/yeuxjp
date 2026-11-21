import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
const { buildGrammarPracticeQuestions } = await loadTsModule("src/lib/grammar-practice.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { recordQuestionPractice } = await loadTsModule("src/lib/learning-session.ts")
const { makeQuestionResult } = await loadTsModule("src/lib/questions.ts")
const { knowledgeReviewId, normalizeKnowledgeReviews, isCurrentKnowledgeCard, enrollKnowledgeCard } = await loadTsModule("src/lib/knowledge-review-model.ts")
const { contentFingerprint } = await loadTsModule("src/lib/content-fingerprint.ts")
const { readKnowledgeReviews, gradeKnowledgeReview } = await loadTsModule("src/lib/knowledge-review-storage.ts")
const { normalizeLearningBackup, LEARNING_BACKUP_VERSION } = await loadTsModule("src/lib/learning-backup.ts")
const { writeLearningJson } = await loadTsModule("src/lib/learning-storage.ts")
const { commitReviewQuestionPractice } = await loadTsModule("src/lib/review-answer-recording.ts")
const { buildReviewDashboardModel } = await loadTsModule("src/lib/review-dashboard-model.ts")
const { resolveTodayReviewItemData } = await loadTsModule("src/lib/today-review-session.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const grammar = buildGrammarPracticeQuestions(Object.values(grammarData).flat().find(p => p.id === "n3-you-ni"))[0]
const sentence = lessonStepToQuestion(STARTER_LESSONS.flatMap(l => l.steps).find(s => s.id === "d135-build"))
function install(fail = false) {
  const map = new Map()
  global.window = { localStorage: {
    getItem: key => map.get(key) ?? null, removeItem: key => map.delete(key),
    setItem: (key, value) => { if (fail && key === STORAGE_KEYS.KNOWLEDGE_REVIEWS) throw Error("full"); map.set(key, String(value)) },
  }, dispatchEvent: () => true }
  global.CustomEvent = class extends Event { constructor(type, init) { super(type); this.detail = init?.detail } }
  return map
}
const progress = { recordPractice: result => writeLearningJson(STORAGE_KEYS.PRACTICE_RESULTS, [result]) }

test("correct grammar and sentence answers schedule future review without creating mistakes or delaying existing schedules", () => {
  install()
  for (const question of [grammar, sentence]) {
    let wrongWrites = 0
    assert.equal(recordQuestionPractice({ progress, notebook: { recordWrong: () => { wrongWrites++; return true } }, result: makeQuestionResult(question, question.correctAnswer) }), true)
    const card = readKnowledgeReviews().value[knowledgeReviewId(question)]
    assert.ok(card.srs.dueAt > Date.now())
    assert.equal(wrongWrites, 0)
    assert.equal(isCurrentKnowledgeCard(card), true)
    assert.equal(recordQuestionPractice({ progress, result: makeQuestionResult(question, question.correctAnswer) }), true)
    assert.deepEqual(readKnowledgeReviews().value[card.id].srs, card.srs)
  }
  assert.deepEqual(readKnowledgeReviews().value[knowledgeReviewId(sentence)].question.chunks, sentence.chunks)
})

test("assisted and incorrect answers do not enroll; schedule write failure rolls practice back", () => {
  for (const result of [{ ...makeQuestionResult(grammar, grammar.correctAnswer), assisted: true }, makeQuestionResult(grammar, "bad")]) {
    install()
    assert.equal(recordQuestionPractice({ progress, result }), true)
    assert.deepEqual(readKnowledgeReviews().value, {})
  }
  const map = install(true)
  assert.equal(recordQuestionPractice({ progress, result: makeQuestionResult(grammar, grammar.correctAnswer) }), false)
  assert.equal(map.size, 0)
})

test("due knowledge enters the common queue, grades the existing card, and retains accepted sentence variants", () => {
  install()
  recordQuestionPractice({ progress, result: makeQuestionResult(sentence, sentence.correctAnswer) })
  const id = knowledgeReviewId(sentence)
  const card = readKnowledgeReviews().value[id]
  const data = resolveTodayReviewItemData({ current: { deck: "knowledge", id }, vocabulary: [], mistakes: new Map(), knowledge: new Map([[id, card]]) }).data
  assert.ok(data)
  assert.deepEqual(data.question.chunks, sentence.chunks)
  const result = makeQuestionResult(data.question, "少しずつ毎日続けることです")
  assert.equal(result.correct, true)
  assert.equal(commitReviewQuestionPractice({ progress, result, grade: () => gradeKnowledgeReview(id, "good", 1000) }), true)
  const updated = readKnowledgeReviews().value[id]
  assert.equal(updated.srs.right, 1)
  assert.ok(updated.srs.dueAt > 1000)
  const dashboard = buildReviewDashboardModel({ masteredIds: [], learnedIds: [], mistakeIds: [], kanaSrsMap: {}, kanaDueIds: [], vocabSrsMap: {}, vocabDueIds: [], mistakeSrsMap: {}, mistakeDueIds: [],
    knowledgeSrsMap: { [id]: updated.srs }, knowledgeDueIds: [id] })
  assert.equal(dashboard.totalDue, 1)
  assert.equal(dashboard.totalEnrolled, 1)
  assert.deepEqual(dashboard.todayQueue, [{ deck: "knowledge", id }])
})

test("backup v5 preserves snapshots and schedules; old v4 remains accepted and expired editions do not replay", () => {
  install()
  recordQuestionPractice({ progress, result: makeQuestionResult(grammar, grammar.correctAnswer) })
  const cards = readKnowledgeReviews().value
  const restored = normalizeLearningBackup({ version: LEARNING_BACKUP_VERSION, exportedAt: 100,
    entries: { [STORAGE_KEYS.KNOWLEDGE_REVIEWS]: JSON.stringify(cards) } })
  assert.deepEqual(normalizeKnowledgeReviews(JSON.parse(restored.entries[STORAGE_KEYS.KNOWLEDGE_REVIEWS])), cards)
  assert.ok(normalizeLearningBackup({ version: 4, exportedAt: 100, entries: {} }))
  const card = Object.values(cards)[0]
  const obsolete = { ...card, question: { ...card.question, explanation: "outdated rule" } }
  assert.equal(isCurrentKnowledgeCard(obsolete), false)
  assert.equal(resolveTodayReviewItemData({ current: { deck: "knowledge", id: card.id }, vocabulary: [], mistakes: new Map(), knowledge: new Map([[card.id, obsolete]]) }).missingReviewEntry, true)
})

test("a failed due-card update rolls back the answer and never recreates removed cards", () => {
  const map = install()
  recordQuestionPractice({ progress, result: makeQuestionResult(grammar, grammar.correctAnswer) })
  const before = new Map(map)
  const id = knowledgeReviewId(grammar)
  const setter = window.localStorage.setItem
  window.localStorage.setItem = (key, value) => { if (key === STORAGE_KEYS.KNOWLEDGE_REVIEWS) throw Error("full"); setter(key, value) }
  assert.equal(commitReviewQuestionPractice({ progress, result: makeQuestionResult(grammar, "wrong"), grade: () => gradeKnowledgeReview(id, "again") }), false)
  assert.deepEqual(map, before)
  window.localStorage.setItem = setter
  map.delete(STORAGE_KEYS.KNOWLEDGE_REVIEWS)
  assert.equal(commitReviewQuestionPractice({ progress, result: makeQuestionResult(grammar, grammar.correctAnswer), grade: () => gradeKnowledgeReview(id, "good") }), false)
  assert.equal(map.has(STORAGE_KEYS.KNOWLEDGE_REVIEWS), false)
})

test("earlier snapshot IDs remain readable; adding missing sentence context preserves the old card and enrolls the corrected one", () => {
  install()
  recordQuestionPractice({ progress, result: makeQuestionResult(sentence, sentence.correctAnswer) })
  const current = Object.values(readKnowledgeReviews().value)[0]
  const legacyId = contentFingerprint([sentence.itemType, sentence.itemId, sentence.questionVersion])
  const older = { ...current, id: legacyId, question: { ...sentence, questionText: sentence.questionText.split("\n\n")[0] } }
  const restored = normalizeKnowledgeReviews({ [legacyId]: older })
  assert.ok(restored)
  assert.equal(isCurrentKnowledgeCard(restored[legacyId]), false)
  const enrolled = enrollKnowledgeCard(restored, sentence, 1000)
  assert.equal(Object.keys(enrolled).length, 2)
  assert.deepEqual(JSON.parse(JSON.stringify(enrolled[legacyId])), JSON.parse(JSON.stringify(older)))
  assert.equal(isCurrentKnowledgeCard(enrolled[current.id]), true)
})
