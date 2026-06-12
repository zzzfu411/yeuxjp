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
  assert.match(source, /<Modal/)
  assert.match(source, /isOpen=\{vocab !== null\}/)
  assert.match(source, /onClose=\{onClose\}/)
  assert.match(source, /const titleId = "vocabulary-focus-modal-title"/)
  assert.match(source, /const descriptionId = "vocabulary-focus-modal-description"/)
  assert.match(source, /ariaLabelledBy=\{titleId\}/)
  assert.match(source, /ariaDescribedBy=\{descriptionId\}/)
  assert.match(source, /id=\{titleId\}/)
  assert.match(source, /id=\{descriptionId\}/)
  assert.match(source, /<button\s+type="button"[\s\S]*data-testid="vocabulary-focus-card"/)
  assert.match(source, /aria-pressed=\{flipped\}/)
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
