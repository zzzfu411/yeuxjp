import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const lessons = await loadTsModule("src/data/lessons.ts")
const session = await loadTsModule("src/lib/lesson-session.ts")

test("lesson practice steps convert to shared Question objects", () => {
  const lesson = lessons.STARTER_LESSONS[0]
  const choice = lesson.steps.find((step) => step.id === "recognize-a")
  const typing = lesson.steps.find((step) => step.id === "type-hello")

  const choiceQuestion = session.lessonStepToQuestion(choice)
  assert.equal(choiceQuestion.type, "lesson:multipleChoice")
  assert.equal(choiceQuestion.itemId, "a")
  assert.equal(choiceQuestion.itemType, "kana")
  assert.equal(choiceQuestion.mode, "recognition")
  assert.deepEqual(choiceQuestion.options.map((option) => option.value), choice.options)

  const typingQuestion = session.lessonStepToQuestion(typing)
  assert.equal(typingQuestion.type, "lesson:typing")
  assert.equal(typingQuestion.itemType, "vocab")
  assert.deepEqual(typingQuestion.acceptedAnswers, typing.acceptedAnswers)
  assert.deepEqual(typingQuestion.options, [{ value: typing.answer, display: typing.answer }])
})

test("sentence build lesson steps become production questions", () => {
  const lesson = lessons.STARTER_LESSONS.find((item) => item.id === "day-4-na-ha-ma-intro-sentence")
  const step = lesson.steps.find((item) => item.type === "sentenceBuild")
  const question = session.lessonStepToQuestion(step)

  assert.equal(question.type, "lesson:sentenceBuild")
  assert.equal(question.itemType, "sentence")
  assert.equal(question.mode, "production")
  assert.equal(question.correctAnswer, step.answer)
})

test("lesson practice counts and completion scores are deterministic", () => {
  const lesson = lessons.STARTER_LESSONS[0]

  assert.equal(session.countPracticeSteps(lesson.steps), 3)
  assert.equal(session.calculateLessonCompletionScore(0, 0), 100)
  assert.equal(session.calculateLessonCompletionScore(2, 3), 67)
  assert.equal(session.calculateLessonCompletionScore(3, 3), 100)
})
