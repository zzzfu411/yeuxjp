import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("PracticeSaveError exposes an accessible shared persistence failure message", () => {
  const source = read("src/components/practice/practice-save-error.tsx")

  assert.match(source, /export function PracticeSaveError/)
  assert.match(source, /role="alert"/)
  assert.match(source, /data-testid="practice-save-error"/)
  assert.match(source, /本次答案没有保存成功/)
  assert.match(source, /浏览器存储权限/)
})

test("all answer surfaces render the shared save failure message", () => {
  const sources = [
    "src/components/lesson/lesson-runner.tsx",
    "src/components/quiz/quiz-runner.tsx",
    "src/components/review/kana-review-session.tsx",
    "src/components/review/vocab-review-session.tsx",
    "src/components/review/mistake-review-session.tsx",
    "src/components/review/today-review-session.tsx",
  ].map(read)

  for (const source of sources) {
    assert.match(source, /PracticeSaveError/)
    assert.match(source, /saveError/)
  }
})
