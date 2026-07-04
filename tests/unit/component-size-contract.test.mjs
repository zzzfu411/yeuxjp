import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

const thinOrchestrationComponents = [
  "src/components/lesson/lesson-runner.tsx",
  "src/components/quiz/quiz-runner.tsx",
  "src/components/review/review-page.tsx",
  "src/components/review/review-runner.tsx",
  "src/components/kana/kana-stroke-animcjk.tsx",
]

function lineCount(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8").split(/\r?\n/).length
}

test("high-risk orchestration components stay below the page split budget", () => {
  for (const relPath of thinOrchestrationComponents) {
    assert.ok(
      lineCount(relPath) <= 350,
      `${relPath} should stay below 350 lines; split UI or pure logic before adding more branches`
    )
  }
})
