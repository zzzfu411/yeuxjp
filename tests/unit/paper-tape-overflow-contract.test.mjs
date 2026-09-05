import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("paper slips keep hanging tape outside overflow-hidden clips", () => {
  const grammar = read("src/components/reference/grammar-point-list.tsx")
  assert.match(grammar, /className="paper-slip grammar-card group relative flex cursor-pointer flex-col"/)
  assert.doesNotMatch(
    grammar,
    /className="paper-slip group relative flex cursor-pointer flex-col overflow-hidden"/
  )
  assert.match(grammar, /className="paper-tape"/)

  const catalog = read("src/components/reference/reference-catalog.tsx")
  assert.match(catalog, /divide-y divide-border/)
})

test("overflow-hidden focus modals pin paper tape inside the clipped sheet", () => {
  for (const relPath of [
    "src/components/vocabulary/vocabulary-focus-modal.tsx",
    "src/components/reference/semantics-focus-modal.tsx",
    "src/components/reference/pragmatics-focus-modal.tsx",
  ]) {
    const source = read(relPath)
    assert.match(source, /overflow-hidden/)
    assert.match(source, /className="paper-tape top-0"/)
  }
})
