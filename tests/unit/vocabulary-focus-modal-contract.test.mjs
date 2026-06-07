import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary page delegates focused card modal to VocabularyFocusModal", () => {
  const page = read("src/app/vocabulary/page.tsx")

  assert.match(page, /from "@\/components\/vocabulary\/vocabulary-focus-modal"/)
  assert.match(page, /<VocabularyFocusModal\b/)
  assert.doesNotMatch(page, /<Modal isOpen=\{selectedVocab !== null\}/)
  assert.doesNotMatch(page, /Tap or Space to Flip/)
})

test("VocabularyFocusModal owns focused vocabulary card controls", () => {
  const source = read("src/components/vocabulary/vocabulary-focus-modal.tsx")

  assert.match(source, /export function VocabularyFocusModal/)
  assert.match(source, /<Modal isOpen=\{vocab !== null\}/)
  assert.match(source, /Tap or Space to Flip/)
  assert.match(source, /<Volume2/)
  assert.match(source, /<CheckCircle2/)
  assert.match(source, /onToggleLearned/)
  assert.match(source, /> Prev/)
  assert.match(source, /Next <ChevronRight/)
})
