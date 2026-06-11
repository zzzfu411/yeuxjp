import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("learning entry surfaces share the centralized entry model", () => {
  for (const relPath of ["src/app/path/page.tsx", "src/components/learning/next-step-card.tsx"]) {
    const source = read(relPath)
    assert.match(source, /from "@\/lib\/learning-entry"/, relPath)
    assert.match(source, /resolveLearningEntry\(/, relPath)
  }

  const home = read("src/app/page.tsx")
  const model = read("src/lib/home-page-model.ts")
  assert.match(home, /from "@\/lib\/home-page-model"/)
  assert.match(home, /buildHomePageModel\(/)
  assert.doesNotMatch(home, /resolveLearningEntry\(/)
  assert.match(model, /from "@\/lib\/learning-entry"/)
  assert.match(model, /resolveLearningEntry\(/)
})

test("starter lesson grids render locked future lessons as non-link cards", () => {
  for (const relPath of ["src/app/page.tsx", "src/app/path/page.tsx"]) {
    const source = read(relPath)
    assert.match(source, /getLessonEntryStatus\(lesson, learning\.completedLessonIds, nextLesson\?\.id\)/, relPath)
    assert.match(source, /if \(locked\)/, relPath)
    assert.match(source, /aria-disabled="true"/, relPath)
  }
})
