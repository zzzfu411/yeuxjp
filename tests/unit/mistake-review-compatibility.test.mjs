import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { partitionReviewMistakes, getMistakeRetirement } = await loadTsModule("src/lib/mistake-review-compatibility.ts")
const { upsertWrongMistake, normalizeMistakeList } = await loadTsModule("src/lib/mistake-notebook-model.ts")
const { questionToMistakeInput, makeQuestionResult } = await loadTsModule("src/lib/questions.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
const { buildGrammarPracticeQuestions } = await loadTsModule("src/lib/grammar-practice.ts")
const { mistakeToQuestion } = await loadTsModule("src/lib/review-questions.ts")
const { buildReviewDashboardModel } = await loadTsModule("src/lib/review-dashboard-model.ts")
const { normalizeBackupEntry } = await loadTsModule("src/lib/learning-backup.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const make = (question, wrong = "not-the-answer") => upsertWrongMistake([], questionToMistakeInput(makeQuestionResult(question, wrong)), 50)[0]

test("legacy homophone and same-gloss conflicts retire without changing the stored snapshot", () => {
  for (const pair of [["ji", "di"], ["zu", "du"], ["o", "wo"]]) {
    const item = make({ type: "audio-kana", correctAnswer: pair[0], options: pair.map(value => ({ value, display: value })) }, pair[1])
    const before = JSON.stringify(item)
    assert.ok(getMistakeRetirement(item))
    assert.equal(JSON.stringify(item), before)
    assert.equal(getMistakeRetirement({ ...item, options: [{ value: pair[0], display: pair[0] }, { value: "ka", display: "か" }] }), null)
  }
  const item = make({ type: "review:vocab", itemId: "sur-v-62", itemType: "vocab", mode: "recall", questionText: "说",
    correctAnswer: "sur-v-62", options: ["sur-v-62", "sur-v-63"].map(value => ({ value, display: value })) }, "sur-v-63")
  assert.ok(getMistakeRetirement(item))
  assert.equal(getMistakeRetirement({ ...item, mode: "meaning" }), null)
})

test("corrected lesson 92 and 135 old mistakes retire; the current edition and baseline unchanged questions remain reviewable", () => {
  for (const id of ["d92-mc-nai", "d135-build", "listen-ki"]) {
    const step = STARTER_LESSONS.flatMap(l => l.steps).find(s => s.id === id)
    const current = make(lessonStepToQuestion(step))
    assert.equal(getMistakeRetirement(current), null, id)
    assert.ok(getMistakeRetirement({ ...current, questionVersion: undefined }), id)
    assert.ok(getMistakeRetirement({ ...current, questionVersion: "superseded-version" }), id)
  }
  const step = STARTER_LESSONS[0].steps.find(s => s.id === "recognize-a")
  assert.equal(getMistakeRetirement({ ...make(lessonStepToQuestion(step)), questionVersion: undefined }), null)
})

test("grammar snapshots are checked against current content and review options vary without moving during feedback", () => {
  const question = buildGrammarPracticeQuestions(Object.values(grammarData).flat()[0], "initial")[0]
  const wrong = question.options.find(o => o.value !== question.correctAnswer).value
  const item = make(question, wrong)
  assert.equal(getMistakeRetirement(item), null)
  assert.equal(getMistakeRetirement({ ...item, questionVersion: undefined }), null)
  assert.ok(getMistakeRetirement({ ...item, explanation: "obsolete rule" }))
  const first = mistakeToQuestion(item, "1")
  const recorded = upsertWrongMistake([item], questionToMistakeInput(makeQuestionResult(first, wrong)), 60)[0]
  assert.deepEqual(mistakeToQuestion(recorded, "1").options, first.options)
  const orders = new Set(Array.from({ length: 15 }, (_, i) => JSON.stringify(mistakeToQuestion(item, String(i)).options)))
  assert.ok(orders.size > 1)
})

test("backup preserves retired records and superseded editions, while dashboard ignores their due dates", () => {
  const step = STARTER_LESSONS.flatMap(l => l.steps).find(s => s.id === "d135-build")
  const current = make(lessonStepToQuestion(step), "毎日続けることです")
  const old = { ...current, questionVersion: undefined, lastWrongAnswer: "少しずつ毎日続けることです", acceptedAnswers: undefined }
  const replaced = upsertWrongMistake([old], questionToMistakeInput(makeQuestionResult(lessonStepToQuestion(step), "毎日続けることです")), 100)
  const restored = normalizeMistakeList(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.MISTAKES, JSON.stringify(replaced))))
  const { active, retired } = partitionReviewMistakes(restored)
  assert.equal(active.length, 1)
  assert.equal(retired.length, 1)
  assert.equal(retired[0].item.lastWrongAnswer, old.lastWrongAnswer)
  assert.equal(retired[0].item.createdAt, old.createdAt)
  const ids = restored.map(i => i.id)
  const srs = Object.fromEntries(ids.map(id => [id, { box: 0, dueAt: 1, createdAt: 1, right: 0, wrong: 1 }]))
  const dashboard = buildReviewDashboardModel({ masteredIds: [], learnedIds: [], items: {}, mistakeIds: active.map(i => i.id), mistakeItems: active,
    kanaSrsMap: {}, kanaDueIds: [], vocabSrsMap: {}, vocabDueIds: [], mistakeSrsMap: srs, mistakeDueIds: ids, now: 100 })
  assert.equal(dashboard.totalDue, 1)
  assert.deepEqual(dashboard.dueMistakeIds, [current.id])
  assert.deepEqual(partitionReviewMistakes(restored), { active, retired })
})
