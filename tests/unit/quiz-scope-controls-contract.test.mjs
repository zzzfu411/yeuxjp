import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates scope filters to QuizScopeControls", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /from "@\/components\/quiz\/quiz-scope-controls"/)
  assert.match(source, /<QuizScopeControls\b/)
  assert.match(source, /onKanaScopeChange=\{setKanaScope\}/)
  assert.match(source, /onVocabScopeChange=\{setVocabScope\}/)
  assert.match(source, /vocabScopeDisabled=\{vocabLoading\}/)
  assert.doesNotMatch(source, /from "@\/lib\/utils"/)
  assert.doesNotMatch(source, /setOnlyUnmasteredKana\(\(v\)/)
  assert.doesNotMatch(source, /setOnlyUnlearnedVocab\(\(v\)/)
  assert.doesNotMatch(source, /border-primary\/40 bg-primary\/5/)
  assert.doesNotMatch(source, /flex flex-wrap p-1 bg-secondary/)
})

test("QuizScopeControls owns kana and vocabulary scope presentation", () => {
  const source = read("src/components/quiz/quiz-scope-controls.tsx")

  assert.match(source, /export function QuizScopeControls/)
  assert.match(source, /scopeButtonClassName/)
  assert.match(source, /filterButtonClassName/)
  assert.match(source, /data-testid="quiz-kana-scope-seion"/)
  assert.match(source, /aria-pressed=\{kanaScope === "seion"\}/)
  assert.match(source, /data-testid="quiz-kana-scope-all"/)
  assert.match(source, /aria-pressed=\{kanaScope === "all"\}/)
  assert.match(source, /data-testid="quiz-only-unmastered-kana"/)
  assert.match(source, /aria-pressed=\{onlyUnmasteredKana\}/)
  assert.match(source, /data-testid=\{`quiz-vocab-scope-\$\{scope\}`\}/)
  assert.match(source, /aria-pressed=\{vocabScope === scope\}/)
  assert.match(source, /disabled=\{vocabScopeDisabled\}/)
  assert.match(source, /vocabScopeDisabled &&/)
  assert.match(source, /data-testid="quiz-only-unlearned-vocab"/)
  assert.match(source, /aria-pressed=\{onlyUnlearnedVocab\}/)
  assert.match(source, /type="button"/)
  assert.match(source, /onKanaScopeChange\("seion"\)/)
  assert.match(source, /onKanaScopeChange\("all"\)/)
  assert.match(source, /onOnlyUnmasteredKanaChange\(!onlyUnmasteredKana\)/)
  assert.match(source, /onVocabScopeChange\(scope as VocabQuizScope\)/)
  assert.match(source, /onOnlyUnlearnedVocabChange\(!onlyUnlearnedVocab\)/)
  assert.match(source, /生存/)
  assert.match(source, /流利/)
})
