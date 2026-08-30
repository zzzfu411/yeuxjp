import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const lessons = await loadTsModule("src/data/lessons.ts")
const entry = await loadTsModule("src/lib/learning-entry.ts")

test("getNextLesson returns null after every starter lesson is complete", () => {
  const completed = new Set(lessons.STARTER_LESSONS.map((lesson) => lesson.id))

  assert.equal(lessons.getNextLesson(completed), null)
  assert.equal(lessons.getNextLesson(completed, "solid"), null)
})

test("lesson entry status respects prerequisites before exposing course links", () => {
  const first = lessons.STARTER_LESSONS[0]
  const second = lessons.STARTER_LESSONS[1]
  const completed = new Set()

  assert.equal(entry.getLessonEntryStatus(first, completed, first.id), "active")
  assert.equal(entry.getLessonEntryStatus(second, completed, first.id), "locked")
  assert.equal(entry.getLessonEntryBadge("locked"), "\u5148\u5b8c\u6210\u524d\u7f6e")

  completed.add(first.id)
  assert.equal(entry.getLessonEntryStatus(first, completed, second.id), "done")
  assert.equal(entry.getLessonEntryStatus(second, completed, second.id), "active")
})

test("solid kana marks foundation lessons skipped and unlocks Day 22", () => {
  const day1 = lessons.STARTER_LESSONS[0]
  const day22 = lessons.STARTER_LESSONS.find((lesson) => lesson.id === "day-22-wa-ga-no")
  const day23 = lessons.STARTER_LESSONS.find((lesson) => lesson.order === 23)
  const empty = new Set()

  assert.equal(entry.getLessonEntryStatus(day1, empty, day1.id, "some"), "active")
  assert.equal(entry.getLessonEntryStatus(day22, empty, day1.id, "some"), "locked")
  assert.equal(entry.getLessonEntryStatus(day1, empty, day22.id, "solid"), "skipped")
  assert.equal(entry.getLessonEntryStatus(day22, empty, day22.id, "solid"), "active")
  assert.equal(entry.getLessonEntryStatus(day23, empty, day22.id, "solid"), "locked")
  assert.equal(entry.isLessonUnlocked(day22, empty, "solid"), true)
  assert.equal(entry.getLessonEntryBadge("skipped"), "\u5df2\u8df3\u8fc7")
})

test("resolveLearningEntry prefers lessons, falls back to skills, then review", () => {
  const lesson = { id: "day-1-a-row-hello", title: "Day 1", subtitle: "Start" }
  const skill = { title: "Kana", short: "Practice kana", href: "/kana?set=seion" }

  assert.deepEqual(entry.resolveLearningEntry({ nextLesson: lesson, skill }), {
    kind: "lesson",
    title: "Day 1",
    subtitle: "Start",
    href: "/learn/day-1-a-row-hello",
    cta: "\u5f00\u59cb\u8bfe\u7a0b",
  })

  assert.deepEqual(entry.resolveLearningEntry({ nextLesson: null, skill }), {
    kind: "skill",
    title: "Kana",
    subtitle: "Practice kana",
    href: "/kana?set=seion",
    cta: "\u5f00\u59cb\u4e13\u9879\u7ec3\u4e60",
  })

  assert.equal(entry.resolveLearningEntry({ nextLesson: null, skill: null }).kind, "review")
  assert.equal(entry.resolveLearningEntry({ nextLesson: null, skill: null }).href, "/review")
})
