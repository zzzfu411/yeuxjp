import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary page delegates search, filters, and category chips to VocabularyToolbar", () => {
  const route = read("src/app/vocabulary/page.tsx")
  const page = read("src/components/vocabulary/vocabulary-page.tsx")

  assert.doesNotMatch(route, /"use client"/)
  assert.match(route, /from "@\/components\/vocabulary\/vocabulary-page"/)
  assert.match(route, /<VocabularyPage \/>/)
  assert.match(page, /from "@\/components\/vocabulary\/vocabulary-toolbar"/)
  assert.match(page, /<VocabularyToolbar\b/)
  assert.match(page, /onSearchChange=\{handleSearchChange\}/)
  assert.match(page, /onLevelChange=\{handleLevelChange\}/)
  assert.match(page, /onToggleOnlyUnlearned=\{handleToggleOnlyUnlearned\}/)
  assert.match(page, /onClearLearned=\{handleClearLearned\}/)
  assert.match(page, /onSelectCategory=\{scrollToCategory\}/)
  assert.match(page, /from "@\/components\/ui\/confirm-action-dialog"/)
  assert.match(page, /const \[confirmClearOpen, setConfirmClearOpen\] = useState\(false\)/)
  assert.match(page, /setConfirmClearOpen\(true\)/)
  assert.match(page, /<ConfirmActionDialog\b/)
  assert.match(page, /open=\{confirmClearOpen\}/)
  assert.match(page, /testId="vocabulary-clear-progress-dialog"/)
  assert.match(page, /onConfirm=\{handleConfirmClearLearned\}/)
  assert.match(page, /onCancel=\{handleCancelClearLearned\}/)
  assert.doesNotMatch(page, /window\.confirm/)
  assert.match(page, /from "@\/components\/practice\/practice-save-error"/)
  assert.match(page, /const \[saveError, setSaveError\] = useState\(false\)/)
  assert.match(page, /const saved = clearLearned\(\)/)
  assert.match(page, /const saved = toggleLearnedId\(selectedVocab\.id\)/)
  assert.match(page, /setSaveError\(!saved\)/)
  assert.match(page, /<PracticeSaveError show=\{saveError && !selectedVocab\} \/>/)
  assert.doesNotMatch(page, /\u7ead|\u7487|\u5a13|\u934a|\u7d35/)
  assert.doesNotMatch(page, /data-testid="vocabulary-search"/)
  assert.doesNotMatch(page, /hasCategoryIcon/)
})

test("VocabularyToolbar owns vocabulary search, level tabs, filters, and category chips", () => {
  const toolbar = read("src/components/vocabulary/vocabulary-toolbar.tsx")

  assert.match(toolbar, /export function VocabularyToolbar/)
  assert.match(toolbar, /data-testid="vocabulary-search"/)
  assert.match(toolbar, /data-testid=\{`vocabulary-level-\$\{level\.id\}`\}/)
  assert.match(toolbar, /aria-pressed=\{currentLevel === level\.id\}/)
  assert.match(toolbar, /onSearchChange\(event\.target\.value\)/)
  assert.match(toolbar, /onLevelChange\(level\.id\)/)
  assert.match(toolbar, /onToggleOnlyUnlearned/)
  assert.match(toolbar, /aria-pressed=\{onlyUnlearned\}/)
  assert.match(toolbar, /data-testid="vocabulary-only-unlearned"/)
  assert.match(toolbar, /data-testid="vocabulary-toggle-romaji"/)
  assert.match(toolbar, /aria-pressed=\{showRomaji\}/)
  assert.match(toolbar, /aria-label="显示罗马音"/)
  assert.doesNotMatch(toolbar, /aria-pressed=\{!showRomaji\}/)
  assert.match(toolbar, /onClearLearned/)
  assert.match(toolbar, /data-testid="vocabulary-clear-progress"/)
  assert.match(toolbar, /type="button"/)
  assert.match(toolbar, /hover:bg-destructive\/10/)
  assert.match(toolbar, /progress\.learned/)
  assert.match(toolbar, /progress\.total/)
  assert.doesNotMatch(toolbar, /Progress:/)
  assert.match(toolbar, /hasCategoryIcon\(category\)/)
  assert.match(toolbar, /aria-pressed=\{activeCategory === category\}/)
  assert.match(toolbar, /onSelectCategory\(category\)/)
})
