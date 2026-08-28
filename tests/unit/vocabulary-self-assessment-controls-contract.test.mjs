import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary self-assessment controls expose three stable accessible ratings", () => {
  const source = read("src/components/vocabulary/vocabulary-self-assessment-controls.tsx")

  assert.match(source, /VOCABULARY_SELF_ASSESSMENT_OPTIONS\.map/)
  assert.match(source, /role="group"/)
  assert.match(source, /aria-label="本次词汇回忆自评"/)
  assert.match(source, /aria-pressed=\{selected\}/)
  assert.match(source, /disabled=\{value !== null\}/)
  assert.match(source, /data-testid=\{`vocabulary-self-grade-\$\{option\.id\}`\}/)
  assert.match(source, /event\.stopPropagation\(\)/)
  assert.match(source, /data-testid="vocabulary-self-grade-status"/)
  assert.match(source, /role="status"/)
  assert.match(source, /aria-live="polite"/)
})

test("vocabulary page records one assessment per focused card and resets between cards", () => {
  const source = read("src/components/vocabulary/vocabulary-page.tsx")

  assert.match(source, /recordVocabularySelfAssessment/)
  assert.match(source, /selfAssessmentLockedRef/)
  assert.match(source, /if \(!selectedVocab \|\| selfAssessment \|\| selfAssessmentLockedRef\.current\) return/)
  assert.match(source, /selfAssessmentLockedRef\.current = false/)
  assert.match(source, /resetFocusedCard\(\)/)
  assert.match(source, /assessment=\{selfAssessment\}/)
  assert.match(source, /onSelfAssess=\{handleSelfAssessment\}/)
  assert.match(source, /if \(saved && onlyUnlearned && !wasLearned\) \{/)
  assert.match(source, /resetSelection\(\)/)
})
