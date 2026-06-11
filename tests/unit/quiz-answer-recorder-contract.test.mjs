import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates shared answer recording to useQuizAnswerRecorder", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /from "@\/components\/quiz\/use-quiz-answer-recorder"/)
  assert.match(source, /useQuizAnswerRecorder\(/)
  assert.match(source, /recordAnswer\(currentQuestion, val\)/)
  assert.match(source, /if \(!result\) \{\s*setSaveError\(true\)\s*return\s*\}/)
  assert.match(source, /setSaveError\(true\)/)
  assert.match(source, /setSaveError\(false\)/)
  assert.match(source, /setSelectedOption\(val\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.doesNotMatch(source, /makeQuestionResult/)
  assert.doesNotMatch(source, /recordQuestionPractice/)
  assert.doesNotMatch(source, /recordQuizAnswer/)
})

test("quiz runner delegates empty question states to QuizEmptyState", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")
  const emptyState = read("src/components/quiz/quiz-empty-state.tsx")

  assert.match(source, /from "@\/components\/quiz\/quiz-empty-state"/)
  assert.match(source, /type QuizEmptyReason/)
  assert.match(source, /from "@\/lib\/quiz-runner-model"/)
  assert.match(source, /getQuizPreflightEmptyReason/)
  assert.match(source, /getQuizNoQuestionReason/)
  assert.match(source, /<QuizEmptyState/)
  assert.match(source, /setEmptyReason\("loading"\)/)
  assert.match(source, /setEmptyReason\(preflightReason\)/)
  assert.match(source, /setEmptyReason\(/)
  assert.match(source, /vocabError/)
  assert.match(source, /onlyUnmasteredKana/)
  assert.match(source, /onlyUnlearnedVocab/)
  assert.match(source, /setCurrentQuestion\(null\)/)
  assert.doesNotMatch(source, /"filter-empty"/)
  assert.doesNotMatch(source, /"pool-too-small"/)
  assert.doesNotMatch(source, /function getQuizEmptyMessage/)
  assert.doesNotMatch(source, /data-testid="quiz-empty-state"/)

  assert.match(emptyState, /export type \{ QuizEmptyReason \} from "@\/lib\/quiz-runner-model"/)
  assert.match(emptyState, /function getQuizEmptyMessage/)
  assert.match(emptyState, /词汇题库加载失败/)
  assert.match(emptyState, /当前题库不足以生成 4 个唯一选项/)
  assert.match(emptyState, /data-testid="quiz-empty-state"/)
  assert.match(emptyState, /data-testid="quiz-retry-vocabulary"/)
  assert.match(emptyState, /reason === "load-error"/)
  assert.doesNotMatch(emptyState, /: "加载中\.\.\."\}/)
})

test("useQuizAnswerRecorder owns question result, stats, and learning record writes", () => {
  const source = read("src/components/quiz/use-quiz-answer-recorder.ts")

  assert.match(source, /export function useQuizAnswerRecorder/)
  assert.match(source, /makeQuestionResult\(question, selectedAnswer\)/)
  assert.match(source, /if \(!recordQuestionPractice\(\{ progress, notebook, result \}\)\) return null/)
  assert.match(source, /setQuizStats\(\(prev\) => recordQuizAnswer\(prev, result\.correct\)\)/)
  assert.match(source, /return result/)
})
