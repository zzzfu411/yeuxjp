import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { buildLessonReviewSummary } = await loadTsModule("src/lib/lesson-review-summary.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { enrollKnowledgeCard } = await loadTsModule("src/lib/knowledge-review-model.ts")
const { upsertWrongMistake } = await loadTsModule("src/lib/mistake-notebook-model.ts")
const { questionToMistakeInput, makeQuestionResult } = await loadTsModule("src/lib/questions.ts")
const { createSrsState } = await loadTsModule("src/lib/srs-model.ts")
const lesson = STARTER_LESSONS.find(lesson => lesson.order === 4)
const assembly = lesson.steps.find(step => step.type === "sentenceBuild")
const comprehension = lesson.steps.find(step => step.itemType === "sentence" && step.type === "multipleChoice")

test("all course grammar/sentence questions and reference-only declarations appear in the recap", () => {
  for (const lesson of STARTER_LESSONS) {
    const rows = buildLessonReviewSummary(lesson, undefined, {}, [], {}, 1000)
    for (const step of lesson.steps.filter(step => ["grammar", "sentence"].includes(step.itemType))) {
      assert.equal(rows.find(row => row.id === step.id).assessment, "unmeasured")
    }
    for (const item of lesson.newItemIds.filter(item => ["grammar", "sentence"].includes(item.type))) {
      if (lesson.steps.some(step => step.itemType === item.type && step.itemId === item.id)) continue
      assert.equal(rows.find(row => row.id === `${item.type}:${item.id}`).assessment, "reference")
    }
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length)
  }
})

test("recap distinguishes independent answers, assisted answers, current SRS and due mistakes", () => {
  const q1 = lessonStepToQuestion(assembly), q2 = lessonStepToQuestion(comprehension)
  const knowledge = enrollKnowledgeCard({}, q1, 1000)
  const mistakes = upsertWrongMistake([], questionToMistakeInput(makeQuestionResult(q2, "wrong", 1000)), 1000)
  const srs = { [mistakes[0].id]: { ...createSrsState(1000), dueAt: 1000 } }
  const progress = { stepAnswers: {
    [assembly.id]: { correct: true, questionVersion: q1.questionVersion, createdAt: 1000 },
    [comprehension.id]: { correct: true, assisted: true, questionVersion: q2.questionVersion, createdAt: 1000 },
  } }
  const rows = buildLessonReviewSummary(lesson, progress, knowledge, mistakes, srs, 2000)
  const first = rows.find(row => row.id === assembly.id), second = rows.find(row => row.id === comprehension.id)
  assert.equal(first.assessment, "correct")
  assert.equal(first.review, "scheduled")
  assert.equal(first.reviewSource, "knowledge")
  assert.equal(second.assessment, "practice")
  assert.equal(second.review, "due")
  assert.equal(second.reviewSource, "mistake")
  assert.equal(buildLessonReviewSummary(lesson, progress, knowledge, [], {}, 700000).find(row => row.id === assembly.id).review, "due")
})

test("historical unversioned completion and retired cards cannot imply current measurement or a current schedule", () => {
  const q = lessonStepToQuestion(assembly)
  const oldKnowledge = enrollKnowledgeCard({}, { ...q, questionVersion: "old-edition" }, 1000)
  const progress = { status: "completed", bestScore: 100, stepAnswers: { [assembly.id]: { correct: true, createdAt: 1000 } } }
  const row = buildLessonReviewSummary(lesson, progress, oldKnowledge, [], {}, 2000).find(row => row.id === assembly.id)
  assert.equal(row.assessment, "unmeasured")
  assert.equal(row.review, "none")
  const current = enrollKnowledgeCard({}, q, 1000)
  const unmeasuredWithCard = buildLessonReviewSummary(lesson, progress, current, [], {}, 2000).find(row => row.id === assembly.id)
  assert.equal(unmeasuredWithCard.assessment, "unmeasured")
  assert.equal(unmeasuredWithCard.review, "scheduled")
})

test("the introductory topic-particle template yields one は and retires its malformed previous snapshot", async () => {
  const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
  const { grammarPracticeTemplateToQuestion } = await loadTsModule("src/lib/grammar-practice.ts")
  const { getMistakeRetirement } = await loadTsModule("src/lib/mistake-review-compatibility.ts")
  const point = grammarData.N5.find(point => point.id === "n5-wa")
  const template = point.practiceTemplates.find(template => template.id === "topic-particle")
  assert.equal(template.prompt.split("。")[0].replace("___", template.answer), "私は学生です")
  const old = grammarPracticeTemplateToQuestion(point, { ...template, prompt: "私は___学生です。主题助词应填哪一个？" })
  const current = grammarPracticeTemplateToQuestion(point, template)
  assert.ok(getMistakeRetirement({ ...old, id: old.mistakeId, wrongCount: 1, createdAt: 0, lastWrongAt: 0 }))
  assert.equal(getMistakeRetirement({ ...current, id: current.mistakeId, wrongCount: 1, createdAt: 0, lastWrongAt: 0 }), null)
})
