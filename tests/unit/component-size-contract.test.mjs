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

const routeAndComponentBudget = 350
const pureLogicBudget = 300

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

function walkTsFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkTsFiles(fullPath, out)
    } else if (entry.name.endsWith(".ts")) {
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
      lineCount(relPath) <= routeAndComponentBudget,
      `${relPath} should stay below ${routeAndComponentBudget} lines; split UI or pure logic before adding more branches`
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
      lineCount(relPath) <= routeAndComponentBudget,
      `${relPath} should stay below ${routeAndComponentBudget} lines; move repeated UI or state branches into focused components or pure modules`
    )
  }
})

test("pure logic modules stay small enough to keep behavior auditable", () => {
  const files = walkTsFiles(path.join(root, "src/lib")).sort()

  assert.ok(files.length > 0, "pure logic size contract should scan src/lib files")

  for (const relPath of files) {
    assert.ok(
      lineCount(relPath) <= pureLogicBudget,
      `${relPath} should stay below ${pureLogicBudget} lines; split dense rules into focused pure modules before adding more branches`
    )
  }
})
