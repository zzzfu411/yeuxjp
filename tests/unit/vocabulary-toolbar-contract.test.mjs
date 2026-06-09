import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary page delegates search, filters, and category chips to VocabularyToolbar", () => {
  const page = read("src/app/vocabulary/page.tsx")

  assert.match(page, /from "@\/components\/vocabulary\/vocabulary-toolbar"/)
  assert.match(page, /<VocabularyToolbar\b/)
  assert.match(page, /onSearchChange=\{handleSearchChange\}/)
  assert.match(page, /onLevelChange=\{handleLevelChange\}/)
  assert.match(page, /onToggleOnlyUnlearned=\{handleToggleOnlyUnlearned\}/)
  assert.match(page, /onClearLearned=\{handleClearLearned\}/)
  assert.match(page, /onSelectCategory=\{scrollToCategory\}/)
  assert.match(page, /确认清空词汇掌握进度吗？/)
  assert.doesNotMatch(page, /\u7ead|\u7487|\u5a13|\u934a|\u7d35/)
  assert.doesNotMatch(page, /data-testid="vocabulary-search"/)
  assert.doesNotMatch(page, /hasCategoryIcon/)
})

test("VocabularyToolbar owns vocabulary search, level tabs, filters, and category chips", () => {
  const toolbar = read("src/components/vocabulary/vocabulary-toolbar.tsx")

  assert.match(toolbar, /export function VocabularyToolbar/)
  assert.match(toolbar, /data-testid="vocabulary-search"/)
  assert.match(toolbar, /onSearchChange\(event\.target\.value\)/)
  assert.match(toolbar, /onLevelChange\(level\.id\)/)
  assert.match(toolbar, /onToggleOnlyUnlearned/)
  assert.match(toolbar, /onClearLearned/)
  assert.match(toolbar, /hasCategoryIcon\(category\)/)
  assert.match(toolbar, /onSelectCategory\(category\)/)
})
