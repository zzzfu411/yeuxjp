import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("LessonRunner delegates practice feedback to LessonPracticeFeedback", () => {
  const source = read("src/components/lesson/lesson-runner.tsx")

  assert.match(source, /from "@\/components\/lesson\/lesson-practice-feedback"/)
  assert.match(source, /<LessonPracticeFeedback step=\{current\} result=\{result\} assisted=/)
  assert.doesNotMatch(source, /CheckCircle2/)
  assert.doesNotMatch(source, /XCircle/)
  assert.doesNotMatch(source, /from "@\/lib\/utils"/)
  assert.doesNotMatch(source, /正确答案：/)
  assert.doesNotMatch(source, /已加入复习计划/)
})

test("LessonPracticeFeedback owns correct/wrong lesson feedback copy", () => {
  const source = read("src/components/lesson/lesson-practice-feedback.tsx")

  assert.match(source, /export function LessonPracticeFeedback/)
  assert.match(source, /CheckCircle2/)
  assert.match(source, /XCircle/)
  assert.match(source, /role="status"/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /正确答案：/)
  assert.match(source, /这道题已加入错题本/)
  assert.match(source, /已加入复习计划/)
  assert.match(source, /canEnrollReviewItem\(step\.itemType, step\.itemId\)/)
  assert.doesNotMatch(source, /step\.itemType === "kana" \|\| step\.itemType === "vocab"/)
})
