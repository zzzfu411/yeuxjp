import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates mode hint copy to QuizModeHint", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /from "@\/components\/quiz\/quiz-mode-hint"/)
  assert.match(source, /<QuizModeHint mode=\{mode\} \/>/)
  assert.doesNotMatch(source, /GlossaryTerm/)
  assert.doesNotMatch(source, /GlossaryButton/)
  assert.doesNotMatch(source, /termId=/)
  assert.doesNotMatch(source, /modeHint/)
  assert.doesNotMatch(source, /逐渐少看罗马音/)
})

test("QuizModeHint owns quiz mode guidance and glossary links", () => {
  const source = read("src/components/quiz/quiz-mode-hint.tsx")

  assert.match(source, /export function QuizModeHint/)
  assert.match(source, /GlossaryTerm/)
  assert.match(source, /GlossaryButton/)
  assert.match(source, /termId="kana"/)
  assert.match(source, /termId="particle"/)
  assert.match(source, /termId="conjugation"/)
  assert.match(source, /termId="chouon"/)
  assert.match(source, /逐渐少看罗马音/)
  assert.match(source, /术语表/)
})
