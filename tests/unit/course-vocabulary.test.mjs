import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { getCourseVocabularyIds, courseVocabularyHref, getCourseVocabularyStatus } = await loadTsModule("src/lib/course-vocabulary.ts")
const { buildLessonCompletionRecapModel } = await loadTsModule("src/lib/lesson-recap-model.ts")
const { loadVocabularyReviewPool } = await loadTsModule("src/data/vocabulary/loader.ts")
const { makeVocabReviewQuestion } = await loadTsModule("src/lib/review-questions.ts")

test("every declared course word has an individual question in all three directions, with only lesson IDs as targets", async () => {
  const covered = new Set()
  for (const lesson of STARTER_LESSONS) {
    const ids = getCourseVocabularyIds(lesson)
    assert.deepEqual(ids, [...new Set(lesson.newItemIds.filter(i => i.type === "vocab").map(i => i.id))])
    if (!ids.length) continue
    const pool = await loadVocabularyReviewPool(ids)
    assert.equal(buildLessonCompletionRecapModel(lesson, () => false).href, courseVocabularyHref(lesson))
    for (const id of ids) {
      covered.add(id)
      for (const direction of ["meaning", "recall", "listening"]) {
        const question = makeVocabReviewQuestion(id, pool, () => 0.3, direction)
        assert.ok(question, `${lesson.id}/${id}/${direction}`)
        assert.equal(question.itemId, id)
        assert.equal(question.correctAnswer, id)
      }
    }
  }
  const declared = new Set(STARTER_LESSONS.flatMap(l => l.newItemIds.filter(i => i.type === "vocab").map(i => i.id)))
  assert.deepEqual(covered, declared)
})

test("mixed-level course collections retain both levels without adding unrelated target words", async () => {
  const lesson = STARTER_LESSONS.find(l => l.id === "day-46-n4-tara")
  const ids = getCourseVocabularyIds(lesson)
  assert.ok(ids.includes("day-gw-8"))
  assert.ok(ids.includes("sur-v-1"))
  assert.equal(ids.includes("sur-g-1"), false)
  const pool = await loadVocabularyReviewPool(ids)
  assert.ok(ids.every(id => pool.some(word => word.id === id)))
  assert.equal(courseVocabularyHref(lesson), `/learn/${lesson.id}/vocabulary`)
})

test("course completion and card self-rating are exposure, while scored failures are measured and SRS due is separate", () => {
  const ids = ["sur-g-1", "sur-g-2", "sur-v-1"]
  const items = { "sur-g-1": { itemType: "vocab", attempts: 4, meaning: 72 },
    "sur-g-2": { itemType: "vocab", attempts: 1, assessmentEvidence: { meaning: { attempts: 1, correct: 0, score: 0 } } } }
  const srs = { "sur-g-1": { dueAt: 100 }, "sur-v-1": { dueAt: 1000 }, unrelated: { dueAt: 1 } }
  const status = getCourseVocabularyStatus(ids, { status: "completed" }, items, srs, 100)
  assert.equal(status.touched, 3)
  assert.deepEqual(status.untestedIds, ["sur-g-1", "sur-v-1"])
  assert.deepEqual(status.dueIds, ["sur-g-1"])
  assert.equal(getCourseVocabularyStatus(ids, { status: "started" }, items, srs, 100).touched, 2)
})
