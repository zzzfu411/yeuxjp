import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("grammar focus modal delegates practice to an isolated session component", () => {
  const modal = read("src/components/reference/grammar-focus-modal.tsx")

  assert.match(modal, /from "@\/components\/reference\/grammar-practice-panel"/)
  assert.match(modal, /<GrammarPracticePanel key=\{point\.id\} point=\{point\} \/>/)
})

test("grammar practice uses shared question judgment and learning recording", () => {
  const source = read("src/components/reference/grammar-practice-panel.tsx")

  assert.match(source, /buildGrammarPracticeQuestions/)
  assert.match(source, /makeQuestionResult\(currentQuestion, selectedAnswer\)/)
  assert.match(source, /recordQuestionPractice\(\{/)
  assert.match(source, /await runLearningWrite\(\(\) => mountedRef\.current && recordQuestionPractice/)
  assert.match(source, /answerLockedRef\.current/)
  assert.match(source, /if \(result \|\| answerLockedRef\.current\) return/)
  assert.match(source, /if \(!saved\)[\s\S]*answerLockedRef\.current = false/)
  assert.match(source, /progress: learning/)
  assert.match(source, /notebook/)
  assert.match(source, /enrollReviewOnCorrect: false/)
  assert.match(source, /testIdPrefix="grammar-practice-answer"/)
  assert.doesNotMatch(source, /localStorage/)
})
