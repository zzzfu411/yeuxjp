import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("quiz generators keep the public entrypoint thin", () => {
  const entry = read("src/lib/quiz-generators.ts")

  assert.match(entry, /generateKanaQuizQuestion/)
  assert.match(entry, /generateVocabularyQuizQuestion/)
  assert.match(entry, /export type \{ KanaQuizScope, QuizMode, VocabQuizScope \}/)
  assert.doesNotMatch(entry, /PARTICLE_QUESTIONS =/)
  assert.doesNotMatch(entry, /VERB_CONJ_VERBS\[Math\.floor/)
  assert.ok(entry.split(/\r?\n/).length < 90)
})

test("quiz question builders own mode-specific question construction", () => {
  const builders = read("src/lib/quiz-question-builders.ts")

  assert.match(builders, /export function generateKanaQuizQuestion/)
  assert.match(builders, /export function generateParticleQuestion/)
  assert.match(builders, /export function generateAudioContrastQuestion/)
  assert.match(builders, /export function generateVerbConjugationQuestion/)
  assert.match(builders, /export function generateVocabularyQuizQuestion/)
  assert.match(builders, /from "@\/lib\/question-options"/)
  assert.doesNotMatch(builders, /from "@\/lib\/review-questions"/)
})
