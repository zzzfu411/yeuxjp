import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary page delegates focused card modal to VocabularyFocusModal", () => {
  const page = read("src/components/vocabulary/vocabulary-page.tsx")

  assert.match(page, /from "@\/components\/vocabulary\/vocabulary-focus-modal"/)
  assert.match(page, /<VocabularyFocusModal\b/)
  assert.doesNotMatch(page, /<Modal isOpen=\{selectedVocab !== null\}/)
  assert.doesNotMatch(page, /点击或按空格翻面/)
})

test("VocabularyFocusModal owns focused vocabulary card controls", () => {
  const source = read("src/components/vocabulary/vocabulary-focus-modal.tsx")

  assert.match(source, /export function VocabularyFocusModal/)
  assert.match(source, /<Modal isOpen=\{vocab !== null\}/)
  assert.match(source, /data-testid="vocabulary-focus-card"/)
  assert.match(source, /data-testid="vocabulary-learned-toggle"/)
  assert.match(source, /点击或按空格翻面/)
  assert.match(source, /朗读/)
  assert.match(source, /<Volume2/)
  assert.match(source, /<CheckCircle2/)
  assert.match(source, /onToggleLearned/)
  assert.match(source, /> 上一条/)
  assert.match(source, /下一条 <ChevronRight/)
  assert.doesNotMatch(source, /Tap or Space to Flip/)
  assert.doesNotMatch(source, /> Listen/)
  assert.doesNotMatch(source, /> Prev/)
  assert.doesNotMatch(source, /Next <ChevronRight/)
})
