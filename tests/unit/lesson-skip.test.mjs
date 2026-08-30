import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const lessons = await loadTsModule("src/data/lessons.ts")
const skip = await loadTsModule("src/lib/lesson-skip.ts")

const day1 = lessons.STARTER_LESSONS.find((lesson) => lesson.order === 1)
const day4 = lessons.STARTER_LESSONS.find((lesson) => lesson.order === 4)
const day21 = lessons.STARTER_LESSONS.find((lesson) => lesson.id === "day-21-kana-graduation")
const day22 = lessons.STARTER_LESSONS.find((lesson) => lesson.id === "day-22-wa-ga-no")
const day23 = lessons.STARTER_LESSONS.find((lesson) => lesson.order === 23)
const day46 = lessons.STARTER_LESSONS.find((lesson) => lesson.order === 46)

test("kana foundation is the first 21 starter days, including early grammar sneak peeks", () => {
  assert.equal(day1.id, "day-1-a-row-hello")
  assert.ok(day4.newItemIds.some((item) => item.type === "grammar"))
  assert.equal(skip.isKanaFoundationLesson(day1), true)
  assert.equal(skip.isKanaFoundationLesson(day4), true)
  assert.equal(skip.isKanaFoundationLesson(day21), true)
  assert.equal(skip.isKanaFoundationLesson(day22), false)
  assert.equal(
    lessons.STARTER_LESSONS.filter((lesson) => skip.isKanaFoundationLesson(lesson)).length,
    skip.KANA_FOUNDATION_LAST_ORDER
  )
})

test("solid kana skips foundation lessons; some still starts at Day 1", () => {
  const empty = new Set()

  assert.equal(lessons.getNextLesson(empty), day1)
  assert.equal(lessons.getNextLesson(empty, "none"), day1)
  assert.equal(lessons.getNextLesson(empty, "some"), day1)
  assert.equal(lessons.getNextLesson(empty, "solid"), day22)
  assert.equal(skip.isLessonSkipped(day1, "some"), false)
  assert.equal(skip.isLessonSkipped(day1, "solid"), true)
  assert.equal(skip.countSatisfiedLessons(lessons.STARTER_LESSONS, empty, "solid"), skip.KANA_FOUNDATION_LAST_ORDER)
})

test("solid skip treats Day 21 as satisfied so Day 22 unlocks without fake completion", () => {
  const empty = new Set()
  assert.equal(skip.isLessonSatisfied(day21, empty, "solid"), true)
  assert.equal(empty.has(day21.id), false)
  assert.equal(lessons.getNextLesson(new Set([day22.id]), "solid"), day23)
})

test("solid skip after N5 grammar still advances into N4 instead of returning to Day 1", () => {
  const n5GrammarDone = new Set(
    lessons.STARTER_LESSONS.filter((lesson) => lesson.track === "starter-45" && lesson.order > 21).map((lesson) => lesson.id)
  )
  assert.equal(lessons.getNextLesson(n5GrammarDone), day1)
  assert.equal(lessons.getNextLesson(n5GrammarDone, "solid"), day46)
})
