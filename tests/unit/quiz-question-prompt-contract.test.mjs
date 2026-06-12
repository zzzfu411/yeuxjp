import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates question prompt rendering to QuizQuestionPrompt", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /from "@\/components\/quiz\/quiz-question-prompt"/)
  assert.match(source, /<QuizQuestionPrompt\b/)
  assert.match(source, /onPlayAudio=\{playAudio\}/)
  assert.doesNotMatch(source, /Volume2/)
  assert.doesNotMatch(source, /questionAudio \?/)
  assert.doesNotMatch(source, /text-6xl/)
  assert.doesNotMatch(source, /text-3xl/)
  assert.doesNotMatch(source, /What does this mean\?/)
})

test("QuizQuestionPrompt owns audio and prompt-specific presentation", () => {
  const source = read("src/components/quiz/quiz-question-prompt.tsx")

  assert.match(source, /export function QuizQuestionPrompt/)
  assert.match(source, /Volume2/)
  assert.match(source, /question\.questionAudio \?/)
  assert.match(source, /aria-label="播放题目音频"/)
  assert.match(source, /onPlayAudio\(question\.questionAudio\)/)
  assert.match(source, /text-6xl/)
  assert.match(source, /text-3xl/)
  assert.match(source, /What does this mean\?/)
  assert.match(source, /选择正确的活用形/)
})
