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
  assert.equal(choiceQuestion.itemId, "hiragana:a")
  assert.equal(choiceQuestion.itemType, "kana")
  assert.equal(choiceQuestion.mode, "recognition")
  assert.deepEqual(choiceQuestion.options.map((option) => option.value), choice.options)

  const alternateChoice = session.lessonStepToQuestion({
    ...choice,
    answer: "a",
    acceptedAnswers: ["A", "ａ"],
    options: ["a", "ka", "sa", "ta"],
  })
  assert.deepEqual(alternateChoice.acceptedAnswers, ["A", "ａ"])

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

test("lesson kana item ids use a hiragana or katakana script prefix", () => {
  for (const lesson of lessons.STARTER_LESSONS) {
    const kanaIds = [
      ...lesson.newItemIds.filter((item) => item.type === "kana").map((item) => item.id),
      ...lesson.steps.filter((step) => step.itemType === "kana").map((step) => step.itemId),
    ]

    for (const itemId of kanaIds) {
      if (/^(sokuon|longvowel):.+/.test(itemId)) continue
      assert.match(itemId, /^(hiragana|katakana):[^:]+$/, `${lesson.id} has a mismatched kana itemId`)
    }
  }
})

test("lesson practice counts and completion scores are deterministic", () => {
  const lesson = lessons.STARTER_LESSONS[0]

  assert.equal(session.countPracticeSteps(lesson.steps), 3)
  assert.equal(session.calculateLessonCompletionScore(0, 0), 100)
  assert.equal(session.calculateLessonCompletionScore(2, 3), 67)
  assert.equal(session.calculateLessonCompletionScore(3, 3), 100)
  assert.equal(session.calculateLessonCompletionScore(5, 3), 100)
  assert.equal(session.calculateLessonCompletionScore(-1, 3), 0)
  assert.equal(session.calculateLessonCompletionScore(Number.NaN, 3), 0)
  assert.equal(session.calculateLessonCompletionScore(1, Number.POSITIVE_INFINITY), 100)
  assert.equal(session.countCorrectLessonAnswers({ a: true, ka: false, sa: true }), 2)
  assert.equal(session.countCorrectLessonAnswers({ a: true, ka: 1, sa: "yes" }), 1)
  assert.equal(session.calculateLessonStepProgress(1, 4), 50)
  assert.equal(session.calculateLessonStepProgress(99, 4), 100)
  assert.equal(session.calculateLessonStepProgress(0, 0), 0)
})

test("lesson answered state restores the latest result for each practice step", () => {
  const lesson = lessons.STARTER_LESSONS[0]
  const answered = session.getLessonAnsweredFromResults("day-1-a-row-hello", lesson.steps, [
    {
      lessonId: "day-1-a-row-hello",
      lessonStepId: "recognize-a",
      itemId: "hiragana:a",
      itemType: "kana",
      mode: "recognition",
      correct: false,
      answer: "i",
      createdAt: 1,
    },
    {
      lessonId: "day-1-a-row-hello",
      lessonStepId: "recognize-a",
      itemId: "hiragana:a",
      itemType: "kana",
      mode: "recognition",
      correct: true,
      answer: "a",
      createdAt: 2,
    },
    {
      lessonId: "day-1-a-row-hello",
      lessonStepId: "recognize-a",
      itemId: "hiragana:a",
      itemType: "kana",
      mode: "recognition",
      correct: false,
      answer: "u",
      createdAt: 0,
    },
    {
      lessonId: "other-lesson",
      lessonStepId: "type-hello",
      itemId: "hello",
      itemType: "vocab",
      mode: "recall",
      correct: true,
      createdAt: 3,
    },
    {
      lessonId: "day-1-a-row-hello",
      lessonStepId: "not-a-practice-step",
      itemId: "x",
      itemType: "lesson",
      mode: "recall",
      correct: true,
      createdAt: 4,
    },
  ])

  assert.deepEqual(answered, { "recognize-a": true })
  assert.deepEqual(session.getLatestLessonStepAnswers("day-1-a-row-hello", lesson.steps, [
    {
      lessonId: "day-1-a-row-hello",
      lessonStepId: "recognize-a",
      itemId: "hiragana:a",
      itemType: "kana",
      mode: "recognition",
      correct: false,
      answer: "i",
      createdAt: 1,
    },
    {
      lessonId: "day-1-a-row-hello",
      lessonStepId: "recognize-a",
      itemId: "hiragana:a",
      itemType: "kana",
      mode: "recognition",
      correct: true,
      answer: "a",
      createdAt: 2,
    },
  ]), {
    "recognize-a": { answer: "a", correct: true, createdAt: 2 },
  })
})

test("persisted lesson step submissions reuse the saved answer without another write", () => {
  const lesson = lessons.STARTER_LESSONS[0]
  const step = lesson.steps.find((item) => item.id === "recognize-a")
  const persisted = { answer: "i", correct: false, createdAt: 123 }

  const duplicate = session.resolveLessonStepSubmission(step, "a", persisted)
  assert.equal(duplicate.shouldRecord, false)
  assert.equal(duplicate.result.selectedAnswer, "i")
  assert.equal(duplicate.result.correct, false)
  assert.equal(duplicate.result.answeredAt, 123)

  const fresh = session.resolveLessonStepSubmission(step, "a")
  assert.equal(fresh.shouldRecord, true)
  assert.equal(fresh.result.selectedAnswer, "a")
  assert.equal(fresh.result.correct, true)
})

test("lesson resume indexes are clamped to existing lesson steps", () => {
  const lesson = lessons.STARTER_LESSONS[0]

  assert.equal(session.clampLessonStepIndex(-2, lesson.steps.length), 0)
  assert.equal(session.clampLessonStepIndex(2.8, lesson.steps.length), 2)
  assert.equal(session.clampLessonStepIndex(999, lesson.steps.length), lesson.steps.length - 1)
  assert.equal(session.clampLessonStepIndex(3, 0), 0)
})

test("started lessons resume from saved step id before numeric index", () => {
  const lesson = lessons.STARTER_LESSONS[0]

  assert.equal(
    session.resolveLessonResumeStepIndex(
      { status: "started", currentStepIndex: 1, lastStepId: lesson.steps[3].id },
      lesson.steps
    ),
    3
  )
  assert.equal(session.resolveLessonResumeStepIndex({ status: "started", currentStepIndex: 999 }, lesson.steps), lesson.steps.length - 1)
  assert.equal(session.resolveLessonResumeStepIndex({ status: "started", lastStepId: "missing" }, lesson.steps), 0)
})

test("completed lessons reopen on the summary step", () => {
  const lesson = lessons.STARTER_LESSONS[0]

  assert.equal(
    session.resolveLessonResumeStepIndex(
      { status: "completed", currentStepIndex: 1, lastStepId: lesson.steps[1].id },
      lesson.steps
    ),
    lesson.steps.length - 1
  )
})

test("lesson runner view model derives course navigation and completion display state", () => {
  const lesson = lessons.STARTER_LESSONS[0]
  const nextLesson = lessons.STARTER_LESSONS[1]

  const view = session.buildLessonRunnerViewModel({
    lesson,
    courseLessons: lessons.STARTER_LESSONS,
    lessons: {
      [lesson.id]: {
        lessonId: lesson.id,
        status: "completed",
        startedAt: 1,
        completedAt: 2,
      },
    },
    stepIndex: 1,
    answered: { "recognize-a": true, "type-hello": false },
    practiceSteps: 3,
    loaded: true,
    lessonUnlocked: true,
  })

  assert.equal(view.lessonPosition, 1)
  assert.equal(view.nextLesson.id, nextLesson.id)
  assert.equal(view.stepProgress, (2 / lesson.steps.length) * 100)
  assert.equal(view.correctCount, 1)
  assert.equal(view.completionScore, 33)
  assert.equal(view.lessonReadOnly, false)
  assert.equal(view.hasCompletedLesson, true)

  const lastLesson = lessons.STARTER_LESSONS.at(-1)
  const lastView = session.buildLessonRunnerViewModel({
    lesson: lastLesson,
    courseLessons: lessons.STARTER_LESSONS,
    lessons: {},
    stepIndex: 999,
    answered: {},
    practiceSteps: 0,
    loaded: false,
    lessonUnlocked: true,
    completedLessonIds: new Set(lessons.STARTER_LESSONS.slice(0, -1).map((item) => item.id)),
  })

  assert.equal(lastView.nextLesson, null)
  assert.equal(lastView.stepProgress, 100)
  assert.equal(lastView.completionScore, 100)
  assert.equal(lastView.lessonReadOnly, true)
  assert.equal(lastView.hasCompletedLesson, false)
})

test("completed lesson next-cta skips kana foundation when the profile already reads kana solidly", () => {
  const day4 = lessons.STARTER_LESSONS.find((lesson) => lesson.id === "day-4-na-ha-ma-intro-sentence")
  const day5 = lessons.STARTER_LESSONS.find((lesson) => lesson.order === 5)
  const day22 = lessons.STARTER_LESSONS.find((lesson) => lesson.order === 22)

  const skipped = session.buildLessonRunnerViewModel({
    lesson: day4,
    courseLessons: lessons.STARTER_LESSONS,
    lessons: {
      [day4.id]: { lessonId: day4.id, status: "completed", startedAt: 1, completedAt: 2 },
    },
    stepIndex: day4.steps.length - 1,
    answered: {},
    practiceSteps: 1,
    loaded: true,
    lessonUnlocked: true,
    completedLessonIds: new Set(),
    kanaLevel: "solid",
  })
  const sequential = session.buildLessonRunnerViewModel({
    lesson: day4,
    courseLessons: lessons.STARTER_LESSONS,
    lessons: {
      [day4.id]: { lessonId: day4.id, status: "completed", startedAt: 1, completedAt: 2 },
    },
    stepIndex: day4.steps.length - 1,
    answered: {},
    practiceSteps: 1,
    loaded: true,
    lessonUnlocked: true,
    completedLessonIds: new Set(
      lessons.STARTER_LESSONS.filter((item) => item.order < 4).map((item) => item.id)
    ),
    kanaLevel: "some",
  })

  assert.equal(skipped.nextLesson.id, day22.id)
  assert.equal(sequential.nextLesson.id, day5.id)
})
