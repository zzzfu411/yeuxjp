import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/mistake-notebook-model.ts")

test("mistake notebook model normalizes persisted mistakes safely", () => {
  const now = 1_700_000_000_000

  const list = model.normalizeMistakeList(
    [
      null,
      { id: "bad" },
      {
        id: "older",
        type: "quiz:vocab",
        questionText: "mizu",
        questionAudio: 123,
        correctAnswer: "water",
        lastWrongAnswer: "tea",
        options: [
          { value: "water", display: "water" },
          { value: "water", display: "duplicate" },
          { value: 1, display: "bad" },
        ],
        meta: {
          verb: { dict: "taberu", kanji: 5, meaning: "eat", kind: "ichidan" },
          askedForm: { id: "te", label: "te-form" },
          ignored: true,
        },
        wrongCount: -5,
        createdAt: Number.POSITIVE_INFINITY,
        lastWrongAt: 10,
      },
      {
        id: "newer",
        type: "quiz:kana",
        correctAnswer: "ka",
        wrongCount: 2.9,
        createdAt: 2,
        lastWrongAt: 20,
      },
      {
        id: "older",
        type: "quiz:vocab",
        correctAnswer: "water",
        lastWrongAnswer: "coffee",
        options: [{ value: "coffee", display: "coffee" }],
        wrongCount: 3,
        createdAt: 1,
        lastWrongAt: 30,
      },
    ],
    now
  )

  assert.deepEqual(list.map((item) => item.id), ["older", "newer"])
  assert.equal(list[0].lastWrongAnswer, "coffee")
  assert.equal(list[0].wrongCount, 3)
  assert.equal(list[1].wrongCount, 2)
  assert.equal(list[1].createdAt, 2)
})

test("mistake notebook timestamps stay finite when inputs and system clock are invalid", () => {
  const originalDateNow = Date.now
  Date.now = () => Number.NaN
  try {
    const normalized = model.normalizeMistakeList(
      [
        {
          id: "broken",
          type: "quiz:kana",
          correctAnswer: "a",
          wrongCount: 1,
          createdAt: Number.NaN,
          lastWrongAt: Number.POSITIVE_INFINITY,
        },
      ],
      Number.NaN
    )
    assert.equal(normalized[0].createdAt, 0)
    assert.equal(normalized[0].lastWrongAt, 0)

    const inserted = model.upsertWrongMistake(
      [],
      {
        type: "quiz:kana",
        correctAnswer: "a",
        wrongAnswer: "ka",
      },
      Number.NaN
    )
    assert.equal(inserted[0].createdAt, 0)
    assert.equal(inserted[0].lastWrongAt, 0)
  } finally {
    Date.now = originalDateNow
  }
})

test("mistake notebook model upserts wrong answers without dropping history", () => {
  const first = model.upsertWrongMistake(
    [],
    {
      type: "quiz:kana",
      questionText: "あ",
      correctAnswer: "a",
      wrongAnswer: "ka",
      options: [
        { value: "a", display: "a" },
        { value: "ka", display: "ka" },
        { value: "ka", display: "duplicate" },
      ],
    },
    100
  )

  const second = model.upsertWrongMistake(
    first,
    {
      type: "quiz:kana",
      questionText: "あ",
      correctAnswer: "a",
      wrongAnswer: "sa",
      options: [{ value: "sa", display: "sa" }],
    },
    200
  )

  assert.equal(second.length, 1)
  assert.equal(second[0].id, model.buildMistakeId({ type: "quiz:kana", questionText: "あ", correctAnswer: "a" }))
  assert.equal(second[0].wrongCount, 2)
  assert.equal(second[0].createdAt, 100)
  assert.equal(second[0].lastWrongAt, 200)
  assert.equal(second[0].lastWrongAnswer, "sa")
  assert.deepEqual(second[0].options, [{ value: "sa", display: "sa" }])
})

test("mistake notebook model removes by id without mutating missing lists", () => {
  const list = [
    {
      id: "one",
      type: "quiz:kana",
      correctAnswer: "a",
      options: [],
      wrongCount: 1,
      createdAt: 1,
      lastWrongAt: 1,
    },
  ]

  assert.equal(model.removeMistakeById(list, "missing"), list)
  assert.deepEqual(model.removeMistakeById(list, "one"), [])
})

test("mistake notebook model preserves normalized accepted answers", () => {
  const first = model.upsertWrongMistake(
    [],
    {
      type: "lesson:typing",
      questionText: "greeting",
      correctAnswer: "hello",
      acceptedAnswers: ["hi", "", "hi", "hey"],
      wrongAnswer: "bye",
    },
    100
  )

  const second = model.upsertWrongMistake(
    first,
    {
      type: "lesson:typing",
      questionText: "greeting",
      correctAnswer: "hello",
      wrongAnswer: "yo",
    },
    200
  )

  assert.deepEqual(first[0].acceptedAnswers, ["hi", "hey"])
  assert.deepEqual(second[0].acceptedAnswers, ["hi", "hey"])
})
