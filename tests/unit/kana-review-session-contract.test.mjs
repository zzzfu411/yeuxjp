import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review runner delegates kana deck sessions to KanaReviewSession", () => {
  const runner = read("src/components/review/review-runner.tsx")

  assert.match(runner, /from "@\/components\/review\/kana-review-session"/)
  assert.match(runner, /<KanaReviewSession ids=\{ids\}/)
  assert.doesNotMatch(runner, /function KanaReviewSession/)
  assert.doesNotMatch(runner, /makeKanaReviewQuestion\(item\.romaji\)/)
  assert.doesNotMatch(runner, /<KanaReviewPrompt\b/)
})

test("KanaReviewSession owns kana queue, prompt, question, and SRS grading", () => {
  const source = read("src/components/review/kana-review-session.tsx")

  assert.match(source, /export function KanaReviewSession/)
  assert.match(source, /useReviewSessionState\(ids\)/)
  assert.match(source, /const \{ dropCurrent \} = review/)
  assert.match(source, /if \(currentId && !item\) \{/)
  assert.match(source, /dropCurrent\(\)/)
  assert.match(source, /return null/)
  assert.match(source, /makeKanaReviewQuestion\(item\.romaji\)/)
  assert.match(source, /<KanaReviewPrompt\b/)
  assert.match(source, /if \(!item\) return false/)
  assert.match(source, /return srs\.grade\(item\.romaji/)
  assert.match(source, /setSaveError\(!recorded\)/)
  assert.match(source, /<PracticeSaveError show=\{saveError\} \/>/)
  assert.match(source, /optionClassName="h-16 text-lg font-medium"/)
})
