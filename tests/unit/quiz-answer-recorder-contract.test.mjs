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

test("quiz runner explains empty question states instead of showing stale questions", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /type QuizEmptyReason = "loading" \| "filter-empty" \| "pool-too-small"/)
  assert.match(source, /function getQuizEmptyMessage/)
  assert.match(source, /setEmptyReason\("loading"\)/)
  assert.match(source, /setEmptyReason\(/)
  assert.match(source, /"filter-empty"/)
  assert.match(source, /"pool-too-small"/)
  assert.match(source, /setCurrentQuestion\(null\)/)
  assert.match(source, /当前题库不足以生成 4 个唯一选项/)
  assert.match(source, /data-testid="quiz-empty-state"/)
  assert.doesNotMatch(source, /: "加载中\.\.\."\}/)
})

test("useQuizAnswerRecorder owns question result, stats, and learning record writes", () => {
  const source = read("src/components/quiz/use-quiz-answer-recorder.ts")

  assert.match(source, /export function useQuizAnswerRecorder/)
  assert.match(source, /makeQuestionResult\(question, selectedAnswer\)/)
  assert.match(source, /if \(!recordQuestionPractice\(\{ progress, notebook, result \}\)\) return null/)
  assert.match(source, /setQuizStats\(\(prev\) => recordQuizAnswer\(prev, result\.correct\)\)/)
  assert.match(source, /return result/)
})
