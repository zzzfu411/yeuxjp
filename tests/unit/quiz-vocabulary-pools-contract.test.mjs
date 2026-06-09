import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz runner delegates vocabulary loading to useQuizVocabularyPools", () => {
  const source = read("src/components/quiz/quiz-runner.tsx")

  assert.match(source, /from "@\/components\/quiz\/use-quiz-vocabulary-pools"/)
  assert.match(source, /useQuizVocabularyPools\(\{ mode, vocabScope \}\)/)
  assert.match(source, /error: vocabError/)
  assert.match(source, /if \(mode === "meaning-vocab" && vocabError\)/)
  assert.match(source, /setEmptyReason\("load-error"\)/)
  assert.doesNotMatch(source, /loadVocabularyScope/)
  assert.doesNotMatch(source, /setVocabPools/)
  assert.doesNotMatch(source, /vocabPools/)
})

test("useQuizVocabularyPools owns scoped vocabulary loading and fallback pool logic", () => {
  const source = read("src/components/quiz/use-quiz-vocabulary-pools.ts")

  assert.match(source, /export function useQuizVocabularyPools/)
  assert.match(source, /loadVocabularyScope\(vocabScope\)/)
  assert.match(source, /base\.length >= 4 \? base : await loadVocabularyScope\("all"\)/)
  assert.match(source, /mode !== "meaning-vocab"/)
  assert.match(source, /loading = mode === "meaning-vocab" && state\.scope !== vocabScope/)
  assert.match(source, /basePool/)
  assert.match(source, /fallbackPool/)
})
