import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const practice = await loadTsModule("src/lib/grammar-practice.ts")
const { grammarData } = await loadTsModule("src/data/grammar-data.ts")

const point = {
  id: "n5-sample",
  title: "Sample grammar",
  structure: "N + particle",
  explanation: "Fallback explanation",
  plainExplanation: "Plain explanation",
  examples: [],
  level: "N5",
}

test("grammar practice templates become stable shared questions", () => {
  const question = practice.grammarPracticeTemplateToQuestion(point, {
    id: " choose-particle ",
    prompt: " Pick the particle. ",
    answer: "は",
    options: [" は ", "が", "は", "  ", "を"],
  })

  assert.equal(question.type, "grammar-practice")
  assert.equal(question.itemId, "n5-sample")
  assert.equal(question.itemType, "grammar")
  assert.equal(question.mode, "recognition")
  assert.equal(question.mistakeId, "grammar-practice:n5-sample:choose-particle")
  assert.equal(question.questionText, "Pick the particle.")
  assert.equal(question.correctAnswer, "は")
  assert.deepEqual(question.options, [
    { value: "は", display: "は" },
    { value: "が", display: "が" },
    { value: "を", display: "を" },
  ])
  assert.match(question.explanation, /Plain explanation/)
  assert.match(question.explanation, /N \+ particle/)
})

test("grammar practice rejects questions that cannot be answered reliably", () => {
  assert.equal(practice.grammarPracticeTemplateToQuestion(point, {
    id: "missing-answer-option",
    prompt: "Pick one",
    answer: "は",
    options: ["が", "を"],
  }), null)

  assert.equal(practice.grammarPracticeTemplateToQuestion(point, {
    id: "one-option",
    prompt: "Pick one",
    answer: "は",
    options: ["は", "は"],
  }), null)
})

test("every N5 grammar point exposes at least one valid practice question", () => {
  assert.equal(grammarData.N5.length, 45)
  for (const grammarPoint of grammarData.N5) {
    const questions = practice.buildGrammarPracticeQuestions(grammarPoint)
    assert.ok(questions.length > 0, `${grammarPoint.id} should have a valid practice question`)
    assert.ok(questions.every((question) => question.itemId === grammarPoint.id))
  }
})

test("every N4, N3, and N2 grammar point exposes at least one valid practice question", () => {
  for (const level of ["N4", "N3", "N2"]) {
    for (const grammarPoint of grammarData[level]) {
      const questions = practice.buildGrammarPracticeQuestions(grammarPoint)
      assert.ok(questions.length > 0, `${grammarPoint.id} should have a valid practice question`)
      assert.ok(questions.every((question) => question.itemId === grammarPoint.id))
    }
  }
})
