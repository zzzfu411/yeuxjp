import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { GRAMMAR_REVIEW_FAMILIES, COMPREHENSION_REVIEW_FAMILIES } = await loadTsModule("src/data/knowledge-review-variants.ts")
const { getKnowledgeReviewVariant, snapshotKnowledgeReviewItems } = await loadTsModule("src/lib/knowledge-review-variant.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { getQuestionResponseFormat, getQuestionPracticeMode } = await loadTsModule("src/lib/questions.ts")
const { isCurrentKnowledgeCard, enrollKnowledgeCard } = await loadTsModule("src/lib/knowledge-review-model.ts")
const { resolveTodayReviewItemData } = await loadTsModule("src/lib/today-review-session.ts")
const now = 2e12
const schedule = { createdAt: now - 5 * 86400000, dueAt: now - 1000, lastReviewedAt: now - 86400000, box: 2, right: 1, wrong: 0 }
const cardFor = question => Object.values(enrollKnowledgeCard({}, question, now))[0]

test("authored grammar variants rotate within the measured grammar point, and fall back after errors or long delays", () => {
  for (const [id, pool] of Object.entries(GRAMMAR_REVIEW_FAMILIES)) {
    const card = cardFor(pool[0])
    const alternate = getKnowledgeReviewVariant(card, schedule, now)
    assert.equal(alternate.kind, "grammar")
    assert.equal(alternate.question.itemId, id)
    assert.equal(alternate.question.mode, card.question.mode)
    assert.notEqual(alternate.question.questionVersion, card.question.questionVersion)
    assert.ok(isCurrentKnowledgeCard({ ...card, question: alternate.question }))
    assert.equal(getKnowledgeReviewVariant(card, { ...schedule, right: 0 }, now).question, card.question)
    assert.equal(getKnowledgeReviewVariant(card, { ...schedule, box: 0, wrong: 1 }, now).question, card.question)
    assert.equal(getKnowledgeReviewVariant(card, schedule, now + 8 * 86400000).question, card.question)
    assert.equal(getKnowledgeReviewVariant(card, { ...schedule, right: pool.length }, now).question, card.question)
  }
})

test("every comprehension alternative is an existing question about the exact same material and mode", () => {
  const sources = new Map()
  for (const lesson of STARTER_LESSONS) for (const step of lesson.steps) {
    if (step.type === "multipleChoice" && step.itemType === "sentence") {
      const q = lessonStepToQuestion(step)
      sources.set(q.questionVersion, { text: step.mode === "listening" ? step.audioText : step.passage, mode: step.mode })
    }
  }
  for (const pool of Object.values(COMPREHENSION_REVIEW_FAMILIES)) {
    assert.ok(pool.length > 1)
    for (const q of pool) {
      const variant = getKnowledgeReviewVariant(cardFor(q), schedule, now)
      assert.equal(variant.kind, "comprehension")
      assert.notEqual(variant.question.questionVersion, q.questionVersion)
      assert.deepEqual(sources.get(variant.question.questionVersion), sources.get(q.questionVersion))
      assert.ok(isCurrentKnowledgeCard({ ...cardFor(q), question: variant.question }))
    }
  }
})

test("later sentence retrieval removes chunks while preserving approved answers and recall-only evidence", () => {
  for (const step of STARTER_LESSONS.flatMap(lesson => lesson.steps).filter(step => step.type === "sentenceBuild")) {
    const card = cardFor(lessonStepToQuestion(step))
    const variant = getKnowledgeReviewVariant(card, { ...schedule, box: 3, right: 2 }, now)
    assert.equal(variant.kind, "recall-input")
    assert.equal(variant.question.chunks, undefined)
    assert.equal(getQuestionResponseFormat(variant.question), "input")
    assert.equal(getQuestionPracticeMode(variant.question), "recall")
    assert.equal(variant.question.correctAnswer, step.answer)
    assert.deepEqual(variant.question.acceptedAnswers, step.acceptedAnswers)
    assert.deepEqual(card.question.chunks, step.chunks)
    assert.equal(getKnowledgeReviewVariant(card, { ...schedule, box: 3, right: 3 }, now).kind, "original")
  }
})

test("grading or a sync refresh cannot change the variant that is already on screen", () => {
  const card = { ...cardFor(GRAMMAR_REVIEW_FAMILIES["n5-wa"][0]), srs: { ...schedule } }
  const cards = new Map([[card.id, card]])
  const [current] = snapshotKnowledgeReviewItems([{ deck: "knowledge", id: card.id }], cards)
  const args = { current, knowledge: cards, mistakes: new Map(), vocabulary: [], seed: "session", now }
  const before = resolveTodayReviewItemData(args).data
  card.srs.right = 2
  card.srs.box = 3
  card.srs.dueAt = now + 86400000
  const after = resolveTodayReviewItemData(args).data
  assert.equal(current.knowledgeReviewState.right, 1)
  assert.deepEqual(after, before)
})
