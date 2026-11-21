import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import ts from "typescript"

const root = path.resolve(import.meta.dirname, "..", "..")
const transactionPath = "src/lib/learning-storage-transaction.ts"

function runtimeDependencies(sourcePath) {
  const source = ts.createSourceFile(sourcePath, fs.readFileSync(path.join(root, sourcePath), "utf8"), ts.ScriptTarget.Latest, true)
  const imports = []
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue
    if (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) continue
    if (ts.isExportDeclaration(node) && node.isTypeOnly) continue
    const specifier = node.moduleSpecifier.text
    if (!specifier.startsWith("@/")) continue
    const dependency = `src/${specifier.slice(2)}.ts`
    assert.ok(fs.existsSync(path.join(root, dependency)), `resolve runtime dependency ${specifier}`)
    imports.push(dependency)
  }
  return imports
}

test("runtime transaction dependencies exclude backups and course content", () => {
  const visited = new Set()
  const pending = [transactionPath]
  while (pending.length) {
    const sourcePath = pending.pop()
    if (visited.has(sourcePath)) continue
    visited.add(sourcePath)
    assert.notEqual(sourcePath, "src/lib/learning-store.ts")
    assert.notEqual(sourcePath, "src/lib/learning-backup.ts")
    assert.ok(!sourcePath.startsWith("src/data/"), `runtime transactions must not bundle course content: ${sourcePath}`)
    pending.push(...runtimeDependencies(sourcePath))
  }
  assert.ok(visited.has("src/lib/learning-events.ts"))
  assert.ok(visited.has("src/lib/managed-learning-storage.ts"))
  assert.ok(visited.has("src/lib/learning-write-lock-state.ts"))
})

test("ordinary practice writes import the lightweight transaction entry", () => {
  const callers = [
    "src/components/review/review-page.tsx",
    "src/lib/daily-study-storage.ts",
    "src/lib/kana-progress.ts",
    "src/lib/kanji-reading-storage.ts",
    "src/lib/learning-progress.ts",
    "src/lib/learning-session.ts",
    "src/lib/mistake-notebook.ts",
    "src/lib/review-answer-recording.ts",
    "src/lib/vocab-progress.ts",
    "src/lib/vocabulary-self-assessment.ts",
    "src/lib/written-work-storage.ts"
  ]
  for (const sourcePath of callers) {
    const source = fs.readFileSync(path.join(root, sourcePath), "utf8")
    assert.match(source, /import \{ runLearningStorageTransaction \} from "@\/lib\/learning-storage-transaction"/, sourcePath)
    assert.doesNotMatch(source, /from "@\/lib\/learning-store"/, sourcePath)
  }
})
