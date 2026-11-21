import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const { STARTER_LESSONS, getLessonById } = await loadTsModule("src/data/lessons.ts")
const session = await loadTsModule("src/lib/lesson-session.ts")

test("old lesson routes and step anchors survive new comprehension material", () => {
  const first = getLessonById("day-1-a-row-hello")
  assert.deepEqual(first.steps.slice(0, 5).map(step => step.id), ["why-a-row", "hello-example", "recognize-a", "listen-o", "type-hello"])
  assert.equal(first.steps.at(-2).id, "coursebook-1-comprehension-v1")
  assert.equal(session.resolveLessonResumeStepIndex({ status: "started", lastStepId: "type-hello" }, first.steps), 4)
  assert.equal(session.resolveLessonResumeStepIndex({ status: "completed" }, first.steps), 6)
  assert.equal(STARTER_LESSONS.length, 175)
})

test("removed question answers cannot inflate current course scores", () => {
  const lesson = STARTER_LESSONS[0]
  const answers = { "recognize-a": true, "listen-o": true, "type-hello": false, "removed-v0": true, summary: true }
  assert.deepEqual(session.filterCurrentLessonAnswers(lesson.steps, answers), { "recognize-a": true, "listen-o": true, "type-hello": false })
  const view = session.buildLessonRunnerViewModel({ lesson, courseLessons: [], lessons: {}, stepIndex: 6, answered: answers, practiceSteps: 4, loaded: true, lessonUnlocked: true })
  assert.equal(view.correctCount, 2)
  assert.equal(view.completionScore, 50)
  const persisted = { "recognize-a": { correct: true, createdAt: 1 }, stale: { correct: true, createdAt: 2 } }
  assert.deepEqual(Object.keys(session.filterCurrentLessonAnswers(lesson.steps, persisted)), ["recognize-a"])
})

test("listening comprehension does not expose a printed passage in its question", () => {
  const lesson = STARTER_LESSONS[1]
  const step = lesson.steps.at(-2)
  assert.equal(step.mode, "listening")
  assert.equal(step.passage, undefined)
  assert.equal(step.audioText, lesson.study.reading)
  assert.ok(step.explanation.includes("も"))
})

test("reading mistakes retain the passage needed to answer during review", () => {
  const lesson = STARTER_LESSONS[0]
  const step = lesson.steps.at(-2)
  const question = session.lessonStepToQuestion(step)
  assert.equal(question.questionText, `${lesson.study.reading}\n\n${step.prompt}`)
  assert.equal(question.questionAudio, undefined)
  assert.equal(question.explanation, step.explanation)
})
