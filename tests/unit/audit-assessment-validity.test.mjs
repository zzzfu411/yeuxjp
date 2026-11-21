import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
const { buildGrammarPracticeQuestions } = await loadTsModule("src/lib/grammar-practice.ts")
const { createSeededRandom } = await loadTsModule("src/lib/seeded-random.ts")
const { makeVocabReviewQuestion } = await loadTsModule("src/lib/review-questions.ts")
const { loadVocabularyReviewPool } = await loadTsModule("src/data/vocabulary/loader.ts")
const { generateKanaQuizQuestion } = await loadTsModule("src/lib/quiz-question-builders.ts")
const { kanaData } = await loadTsModule("src/data/kana-data.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { lessonStepToQuestion } = await loadTsModule("src/lib/lesson-session.ts")
const { isQuestionAnswerCorrect } = await loadTsModule("src/lib/questions.ts")
const { questionToMistakeInput, makeQuestionResult } = await loadTsModule("src/lib/questions.ts")

test("grammar sessions preserve answer values, stay stable, and distribute correct positions", () => {
  const points = Object.values(grammarData).flat()
  const first = points.flatMap(p => buildGrammarPracticeQuestions(p, "round-1"))
  assert.deepEqual(first, points.flatMap(p => buildGrammarPracticeQuestions(p, "round-1")))
  const second = points.flatMap(p => buildGrammarPracticeQuestions(p, "round-2"))
  assert.notDeepEqual(first.map(q => q.options), second.map(q => q.options))
  const positions = first.map(q => q.options.findIndex(o => o.value === q.correctAnswer))
  for (let index = 0; index < 4; index++) {
    const count = positions.filter(p => p === index).length
    assert.ok(count > first.length * 0.1 && count < first.length * 0.4, `${index}: ${count}`)
  }
  for (const question of first) {
    assert.equal(question.options.filter(o => isQuestionAnswerCorrect(question, o.value)).length, 1)
  }
})

test("context-free recall never offers 話す and 言う as mutually exclusive answers", async () => {
  const pool = await loadVocabularyReviewPool(["sur-v-62", "sur-v-63", "sur-v-38", "sur-v-36", "sur-v-17"])
  for (const target of ["sur-v-62", "sur-v-63"]) {
    for (let seed = 0; seed < 100; seed++) {
      const question = makeVocabReviewQuestion(target, pool, createSeededRandom(String(seed)), "recall")
      assert.ok(question, "three unambiguous distractors remain available")
      assert.equal(question.options.filter(o => ["sur-v-62", "sur-v-63"].includes(o.value)).length, 1)
    }
  }
})

test("audio kana options exclude all common-language homophone pairs in both directions", () => {
  for (const pair of [["ji", "di"], ["zu", "du"], ["o", "wo"]]) {
    for (const targetId of pair) {
      const target = kanaData.find(k => k.romaji === targetId)
      assert.ok(target)
      for (let seed = 0; seed < 100; seed++) {
        const question = generateKanaQuizQuestion({ mode: "audio-kana", basePool: kanaData,
          targetPool: [target], random: createSeededRandom(String(seed)) })
        assert.ok(question)
        assert.equal(question.options.filter(o => pair.includes(o.value)).length, 1)
      }
    }
  }
})

test("listening test titles do not reveal any accepted answer", () => {
  const leaks = STARTER_LESSONS.flatMap(lesson => lesson.steps.filter(step =>
    step.type === "multipleChoice" && step.mode === "listening" &&
    [step.answer, ...(step.acceptedAnswers ?? [])].some(answer => step.title.includes(answer))
  ).map(step => `${lesson.id}/${step.id}: ${step.title}`))
  assert.deepEqual(leaks, [])
})

test("lesson 92 accepts both supported negative-purpose forms while rejecting invalid choices", () => {
  const lesson = STARTER_LESSONS.find(l => l.order === 92)
  const question = lessonStepToQuestion(lesson.steps.find(s => s.id === "d92-mc-nai"))
  assert.equal(isQuestionAnswerCorrect(question, "ように"), true)
  assert.equal(isQuestionAnswerCorrect(question, "ために"), true)
  assert.equal(isQuestionAnswerCorrect(question, "ばかり"), false)
  assert.equal(isQuestionAnswerCorrect(question, "うちに"), false)
  assert.doesNotMatch(JSON.stringify(lesson), /ない形表目的必须|不能说 忘れないために|聞こえる 是可能形/)
})

test("reviewed sentence variants reach scoring and the mistake snapshot without accepting missing chunks", () => {
  const step = STARTER_LESSONS.find(l => l.order === 135).steps.find(s => s.id === "d135-build")
  const question = lessonStepToQuestion(step)
  assert.equal(isQuestionAnswerCorrect(question, "少しずつ毎日続けることです"), true)
  assert.equal(isQuestionAnswerCorrect(question, "毎日続けることです"), false)
  assert.equal(isQuestionAnswerCorrect(question, "毎日ずつ少し続けることです"), false)
  const mistake = questionToMistakeInput(makeQuestionResult(question, "毎日続けることです"))
  assert.deepEqual(mistake.acceptedAnswers, ["少しずつ毎日続けることです"])
})
