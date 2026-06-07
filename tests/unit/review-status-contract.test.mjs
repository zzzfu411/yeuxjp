import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates status UI and vocabulary loading to shared modules", () => {
  const source = read("src/components/review/review-runner.tsx")

  assert.match(source, /from "@\/components\/review\/review-status"/)
  assert.match(source, /from "@\/components\/review\/review-vocabulary"/)
  assert.doesNotMatch(source, /function ReviewDone/)
  assert.doesNotMatch(source, /function useAllVocabulary/)
  assert.doesNotMatch(source, /loadVocabularyScope/)
  assert.doesNotMatch(source, /state-complete\.webp/)
})

test("review status owns completion and loading surfaces", () => {
  const source = read("src/components/review/review-status.tsx")

  assert.match(source, /export function ReviewLoadingState/)
  assert.match(source, /export function ReviewDone/)
  assert.match(source, /state-complete\.webp/)
})

test("review vocabulary hook owns all vocabulary loading", () => {
  const source = read("src/components/review/review-vocabulary.ts")

  assert.match(source, /export function useAllVocabulary/)
  assert.match(source, /loadVocabularyScope\("all"\)/)
})
