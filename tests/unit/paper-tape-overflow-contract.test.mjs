import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("paper slips keep hanging tape outside overflow-hidden clips", () => {
  const banner = read("src/components/kana/kana-banner.tsx")
  assert.match(banner, /className=\{cn\([\s\S]*"paper-slip relative mx-auto min-h-32 w-full max-w-3xl"/)
  assert.doesNotMatch(
    banner,
    /"paper-slip relative mx-auto min-h-32 w-full max-w-3xl overflow-hidden"/
  )
  assert.match(banner, /absolute inset-y-0 right-0 w-\[44%\] overflow-hidden/)
  assert.match(banner, /className="paper-tape"/)

  const grammar = read("src/components/reference/grammar-point-list.tsx")
  assert.match(grammar, /className="paper-slip group relative flex cursor-pointer flex-col"/)
  assert.doesNotMatch(
    grammar,
    /className="paper-slip group relative flex cursor-pointer flex-col overflow-hidden"/
  )
  assert.match(grammar, /className="paper-tape"/)

  const semantics = read("src/components/reference/semantics-reference-page.tsx")
  assert.match(semantics, /className="paper-slip group relative"/)
  assert.doesNotMatch(semantics, /className="paper-slip group relative overflow-hidden"/)
  assert.match(semantics, /className="paper-tape"/)
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
