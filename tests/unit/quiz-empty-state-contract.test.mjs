import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("QuizEmptyState owns empty quiz copy and recovery actions", () => {
  const source = read("src/components/quiz/quiz-empty-state.tsx")

  assert.match(source, /export type QuizEmptyReason/)
  assert.match(source, /export function QuizEmptyState/)
  assert.match(source, /function getQuizEmptyMessage/)
  assert.match(source, /加载中\.\.\./)
  assert.match(source, /词汇题库加载失败/)
  assert.match(source, /当前题库不足以生成 4 个唯一选项/)
  assert.match(source, /data-testid="quiz-empty-state"/)
  assert.match(source, /data-testid="quiz-retry-vocabulary"/)
  assert.match(source, /onClick=\{onRetryVocabulary\}/)
  assert.match(source, /onClick=\{onExit\}/)
})
