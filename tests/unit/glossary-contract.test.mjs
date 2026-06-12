import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("Glossary modal uses localized example labels", () => {
  const source = read("src/components/ui/glossary.tsx")

  assert.match(source, /export function GlossaryProvider/)
  assert.match(source, /例子/)
  assert.doesNotMatch(source, /Examples/)
})
