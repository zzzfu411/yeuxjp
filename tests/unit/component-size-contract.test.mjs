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

function walkTsxFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkTsxFiles(fullPath, out)
    } else if (entry.name.endsWith(".tsx")) {
      out.push(path.relative(root, fullPath).replace(/\\/g, "/"))
    }
  }
  return out
}

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

test("route pages and UI components stay below the page split budget", () => {
  const files = [
    ...walkTsxFiles(path.join(root, "src/app")),
    ...walkTsxFiles(path.join(root, "src/components")),
  ].sort()

  assert.ok(files.length > thinOrchestrationComponents.length, "component size contract should scan app and component files")

  for (const relPath of files) {
    assert.ok(
      lineCount(relPath) <= 350,
      `${relPath} should stay below 350 lines; move repeated UI or state branches into focused components or pure modules`
    )
  }
})
