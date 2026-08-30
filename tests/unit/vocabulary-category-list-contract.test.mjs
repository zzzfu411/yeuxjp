import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("vocabulary page delegates categorized card grid and status copy to VocabularyCategoryList", () => {
  const page = read("src/components/vocabulary/vocabulary-page.tsx")

  assert.match(page, /from "@\/components\/vocabulary\/vocabulary-category-list"/)
  assert.match(page, /<VocabularyCategoryList\b/)
  assert.match(page, /useVocabularyLevelData\(currentLevel\)/)
  assert.match(page, /loading=\{vocabulary\.loading\}/)
  assert.match(page, /error=\{vocabulary\.error\}/)
  assert.match(page, /onRetry=\{vocabulary\.retry\}/)
  assert.match(page, /onExpand=\{openAt\}/)
  assert.match(page, /useIndexedModalNavigation\(currentData\.length, resetFocusedCard\)/)
  assert.match(page, /setIsModalFlipped\(false\)/)
  assert.doesNotMatch(page, /reloadNonce/)
  assert.doesNotMatch(page, /handleRetryLoad/)
  assert.doesNotMatch(page, /setVocabState/)
  assert.doesNotMatch(page, /loadVocabularyLevel/)
  assert.doesNotMatch(page, /<Flashcard\b/)
  assert.doesNotMatch(page, /<CategoryIcon\b/)
  assert.doesNotMatch(page, /getVocabularyItemsByCategory/)
  assert.doesNotMatch(page, /findVocabularyIndex/)
  assert.doesNotMatch(page, /正在加载词汇/)
  assert.doesNotMatch(page, /词汇加载失败/)
})

test("VocabularyCategoryList owns category sections, cards, indexes, and status states", () => {
  const source = read("src/components/vocabulary/vocabulary-category-list.tsx")

  assert.match(source, /export function VocabularyCategoryList/)
  assert.match(source, /from "@\/components\/ui\/button"/)
  assert.match(source, /onRetry: \(\) => void/)
  assert.match(source, /<CategoryIcon category=\{category\}/)
  assert.match(source, /<Flashcard/)
  assert.match(source, /getVocabularyItemsByCategory\(items, category\)/)
  assert.match(source, /findVocabularyIndex\(items, vocab\.id\)/)
  assert.match(source, /onExpand\(findVocabularyIndex\(items, vocab\.id\)\)/)
  assert.match(source, /loading &&/)
  assert.match(source, /!loading && error/)
  assert.match(source, /onClick=\{onRetry\}/)
  assert.match(source, /data-testid="vocabulary-retry-load"/)
  assert.match(source, /!loading && !error && items\.length === 0/)
  assert.match(source, /\\u6b63\\u5728\\u52a0\\u8f7d\\u8bcd\\u6c47/)
  assert.match(source, /\\u8bcd\\u6c47\\u52a0\\u8f7d\\u5931\\u8d25/)
  assert.match(source, /\\u91cd\\u65b0\\u52a0\\u8f7d/)
  assert.match(source, /\\u8be5\\u7b49\\u7ea7\\u6682\\u65e0\\u5339\\u914d\\u8bcd\\u6c47/)
})

test("Flashcard exposes stable browser hooks for expanding vocabulary cards", () => {
  const source = read("src/components/vocabulary/flashcard.tsx")

  assert.match(source, /data-testid=\{`vocabulary-expand-\$\{vocab\.id\}`\}/)
  assert.match(source, /data-testid=\{`vocabulary-expand-back-\$\{vocab\.id\}`\}/)
  assert.match(source, /aria-label=\{`朗读 \$\{vocab\.kana\}`\}/)
  assert.match(source, /const stopCardKeyDown = \(e: React\.KeyboardEvent\) => \{/)
  assert.match(source, /e\.stopPropagation\(\)/)
  assert.match(source, /if \(e\.target !== e\.currentTarget\) return/)
  assert.match(source, /onKeyDown=\{stopCardKeyDown\}/)
  assert.match(source, /aria-hidden=\{isFlipped\}/)
  assert.match(source, /aria-hidden=\{!isFlipped\}/)
  assert.match(source, /tabIndex=\{isFlipped \? -1 : 0\}/)
  assert.match(source, /tabIndex=\{isFlipped \? 0 : -1\}/)
})
