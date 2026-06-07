import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

function reviewSessionSources() {
  return [
    read("src/components/review/review-runner.tsx"),
    read("src/components/review/kana-review-session.tsx"),
    read("src/components/review/vocab-review-session.tsx"),
  ].join("\n")
}

test("review sessions delegate prompt content rendering to prompt components", () => {
  const source = reviewSessionSources()

  assert.match(source, /<MixedReviewPrompt\b/)
  assert.match(source, /<KanaReviewPrompt\b/)
  assert.match(source, /<VocabReviewPrompt\b/)
  assert.match(source, /<MistakeReviewPrompt\b/)
  assert.doesNotMatch(source, /Volume2/)
  assert.doesNotMatch(source, /text-7xl/)
  assert.doesNotMatch(source, /text-6xl/)
  assert.doesNotMatch(source, /text-4xl/)
  assert.doesNotMatch(source, /text-3xl/)
})

test("review prompt content owns audio buttons and prompt typography", () => {
  const source = read("src/components/review/review-prompt-content.tsx")

  assert.match(source, /Volume2/)
  assert.match(source, /function ReviewAudioButton/)
  assert.match(source, /export function MixedReviewPrompt/)
  assert.match(source, /export function KanaReviewPrompt/)
  assert.match(source, /export function VocabReviewPrompt/)
  assert.match(source, /export function MistakeReviewPrompt/)
  assert.match(source, /text-7xl/)
  assert.match(source, /text-6xl/)
  assert.match(source, /text-4xl/)
  assert.match(source, /text-3xl/)
})
