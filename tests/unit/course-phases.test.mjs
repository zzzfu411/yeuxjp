import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const phases = await loadTsModule("src/lib/course-phases.ts")
const lessons = await loadTsModule("src/data/lessons.ts")

test("course phases cover the 175-day N5 to N2 path", () => {
  assert.deepEqual(phases.COURSE_PHASES.map((phase) => phase.id), ["n5", "n4", "n3", "n2"])
  assert.equal(phases.getCoursePhaseByTrack("n4-core").id, "n4")
  assert.equal(phases.getLessonCoursePhase({ track: "n2-core" }).id, "n2")

  const first = lessons.STARTER_LESSONS[0]
  const n4 = lessons.STARTER_LESSONS.find((lesson) => lesson.order === 46)
  const last = lessons.STARTER_LESSONS[lessons.STARTER_LESSONS.length - 1]
  assert.equal(phases.getLessonCoursePhase(first).id, "n5")
  assert.equal(n4?.track, "n4-core")
  assert.equal(phases.getLessonCoursePhase(last).id, "n2")
  assert.equal(lessons.STARTER_LESSONS.length, 175)
})

test("active course phase follows the next incomplete lesson", () => {
  const completed = new Set(lessons.STARTER_LESSONS.filter((lesson) => lesson.order <= 45).map((lesson) => lesson.id))
  const active = phases.getActiveCoursePhase(lessons.STARTER_LESSONS, completed, null)
  assert.equal(active.id, "n4")

  const n4Progress = phases.countPhaseProgress(lessons.STARTER_LESSONS, completed, "n4-core")
  assert.equal(n4Progress.done, 0)
  assert.equal(n4Progress.total, 45)
})

test("solid kana separates skipped foundation lessons from completed N5 lessons", () => {
  const empty = new Set()
  const n5GrammarDone = new Set(
    lessons.STARTER_LESSONS.filter((lesson) => lesson.track === "starter-45" && lesson.order > 21).map((lesson) => lesson.id)
  )

  assert.equal(phases.getActiveCoursePhase(lessons.STARTER_LESSONS, empty, null, "some").id, "n5")
  assert.equal(phases.getActiveCoursePhase(lessons.STARTER_LESSONS, empty, null, "solid").id, "n5")
  assert.equal(phases.countPhaseProgress(lessons.STARTER_LESSONS, empty, "starter-45", "solid").done, 0)
  assert.equal(phases.countPhaseProgress(lessons.STARTER_LESSONS, empty, "starter-45", "solid").skipped, 21)
  assert.equal(phases.getActiveCoursePhase(lessons.STARTER_LESSONS, n5GrammarDone, null).id, "n5")
  assert.equal(phases.getActiveCoursePhase(lessons.STARTER_LESSONS, n5GrammarDone, null, "solid").id, "n4")
})
